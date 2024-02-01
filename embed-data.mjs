import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import axios from 'axios';
import schema from './config.mjs';

dotenv.config();

console.log("Connection string: ", process.env.MDBCONNSTR);
const MDB_DB = process.env.MDB_DB ? process.env.MDB_DB : "sample_mflix";
const MDB_COLL = process.env.MDB_COLL ? process.env.MDB_COLL : "movies_embedded_ada"
console.log("Database: ", MDB_DB);
console.log("Collection: ", MDB_COLL);

//use the serverless function that has been started under nodeJS.
async function embed(input){
    try{
      const embeddingResp = await axios.get('http://localhost:3000/api/embed?terms='+input);
      return embeddingResp.data;
    }catch (e) {
        console.log(`${e}`);
    }
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
                    {$and:[{[schema.vectorField]:{$exists:false}},{[schema.vectorSourceField]:{$exists:true}}]}
                ).project({[schema.vectorSourceField]:1});
            
            var embedded_count = 0;
            for await (const doc of cursor){
                try{
                    collection.updateOne({_id:doc._id},{$set:{[schema.vectorField]:await embed(doc[schema.vectorSourceField])}});
                    embedded_count += 1;
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