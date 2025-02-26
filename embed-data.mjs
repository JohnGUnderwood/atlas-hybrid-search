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
      const embeddingResp = await axios.get('http://localhost:3000/api/embed?cache=false&terms='+input);
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
            const cursor = collection
                .find(
                    {$and:[
                        {$or:[{[schema.vectorField]:{$exists:false}},{[schema.vectorField]:null}]},
                        {[schema.vectorSourceField]:{$exists:true}}
                    ]}
                ).project({[schema.vectorSourceField]:1});
            
            var embedded_count = 0;
            for await (const doc of cursor){
                try{
                    const embedding = await embed(doc[schema.vectorSourceField]);
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