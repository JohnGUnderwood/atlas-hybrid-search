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

console.log("Connection string: ", process.env.MDBCONNSTR);
const MDB_DB = process.env.MDB_DB ? process.env.MDB_DB : "sample_mflix";
const MDB_COLL = process.env.MDB_COLL ? process.env.MDB_COLL : "movies_embedded_ada"
console.log("Database: ", MDB_DB);
console.log("Collection: ", MDB_COLL);

try{
  const client = new MongoClient(process.env.MDBCONNSTR);
  try{
      await client.connect();
      try{
        const db = client.db(MDB_DB);
        const collection = db.collection(MDB_COLL);
        await collection.createSearchIndex(searchIndex);
        // TO DO: this will not work until a command is added to the driver for creating vector indexes.
        // await collection.createSearchIndex(vectorIndex);
        console.log(collection.listSearchIndexes());
        console.log("You must now manually create the vector index on your collection.")
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
