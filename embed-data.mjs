import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import axios from 'axios';
import schema from './config.mjs';

dotenv.config({override:true});

console.log("Connection string: ", process.env.MDBCONNSTR);
const MDB_DB = process.env.MDB_DB ? process.env.MDB_DB : "sample_mflix";
const MDB_COLL = process.env.MDB_COLL ? process.env.MDB_COLL : "movies_embedded_ada"
console.log("Database: ", MDB_DB);
console.log("Collection: ", MDB_COLL);

//use the serverless function that has been started under nodeJS.
async function embed(input){
    try{
      const embeddingResp = await axios.get(`http://localhost:3000/api/embed?cache=false&type=document&terms=${input}`);
      if(embeddingResp.status === 429){
        console.log("Rate limit exceeded. Waiting 1s before retrying");
            await wait(1000);
            return embed(input);
      }
      return embeddingResp.data;
    }catch (e) {
        console.log(`${e}`);
    }
}

function wait(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  } 

try{
    const client = new MongoClient(process.env.MDBCONNSTR);
    try{
        await client.connect();
        try{
            const db = client.db(MDB_DB);
            const collection = db.collection(MDB_COLL);

            var project = {};
            // check if schema.vectorSourceField is an array
            if(schema.vectorSourceField && Array.isArray(schema.vectorSourceField)){
                for (const field of schema.vectorSourceField){
                    project[field] = 1;
                }
            }else{
                project[schema.vectorSourceField] = 1;
            }
            const cursor = collection
                .find(
                    {$or:[{[schema.vectorField]:{$exists:false}},{[schema.vectorField]:null}]}
                ).project(project);
            
            var embedded_count = 0;
            for await (const doc of cursor){
                try{
                    let stringToEmbed = "";
                    if(schema.vectorSourceField){
                        if(Array.isArray(schema.vectorSourceField)){
                            for (const field of schema.vectorSourceField){
                                if(doc[`${field}`]){
                                    if(Array.isArray(doc[field])){
                                        stringToEmbed += `${field}: ${doc[field].join(", ")}\n`;
                                    }else{
                                        stringToEmbed += `${field}: `+`${doc[field]}`.toString()+`\n`;
                                    }
                                }
                            }
                        }else{
                            if(doc[schema.vectorSourceField]){
                                stringToEmbed = doc[schema.vectorSourceField];
                            }
                        }
                    }
                    const embedding = await embed(stringToEmbed);
                    await collection.updateOne({_id:doc._id},{$set:{[schema.vectorField]:embedding}});
                    console.log(`Embedded document: ${doc._id}`);
                    embedded_count += 1;
                    //add 1/4s time delay so we don't hit rate limits on an endpoint
                    wait(250);
                }catch (e){
                    console.log(e)
                }
            }
            
            console.log(`Embedded ${embedded_count} documents`);
            
        }catch(error){
          console.log(`Connection failed ${error}`);
          throw error;
        }finally{
          client.close();
        }
    }catch(error){
        throw error;
    }
  }catch(error){
    console.log(`Connection failed ${error}`);
    throw error;
  }