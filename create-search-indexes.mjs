import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const searchIndex = {
  name:"searchIndex",
  definition: {
    "mappings": {
      "dynamic": false,
      "fields": {
        "plot": {
          "type": "string"
        },
        "title": [
          {
            "type": "string"
          },
          {
            "type": "autocomplete"
          }
        ],
        "genres":[
          {
            "type":"stringFacet"
          },
          {
            "type":"token"
          }
        ]
      }
    }
  }
  
}

const vectorIndex = {
  name: "vectorIndex",
  definition: {
    "type": "vectorSearch",
    "fields": [
      {
        "type": "vector",
        "path": "plot_embedding",
        "numDimensions": 1536,
        "similarity": "cosine"
      }
    ]
  }
}

console.log("Connection string: ", process.env.MDB_URI);
console.log("Database: ", process.env.MDB_DB);
console.log("Collection: ", process.env.MDB_Coll);

try{
  const client = new MongoClient(process.env.MDB_URI);
  try{
      await client.connect();
      try{
        const db = client.db(process.env.MDB_DB);
        const collection = db.collection(process.env.MDB_COLL);
        await collection.createSearchIndex(searchIndex);
        await collection.createSearchIndex(vectorIndex);
        console.log(collection.listSearchIndexes());
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
