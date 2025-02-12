import { MongoClient, MongoError } from 'mongodb';
import dotenv from 'dotenv';
import schema from './config.mjs';
dotenv.config();

const searchIndex = {
  name:"searchIndex",
  definition: {
    "mappings": {
      "dynamic": false,
      "fields": {
        "_id":{"type":"objectId"},
        [`${schema.descriptionField}`]: {
          "type": "string",
            "analyzer":"lucene.english",
            "multi": {
              "standardAnalyzer": {
                "type": "string",
                "analyzer": "lucene.standard"
              }
            }
        },
        [`${schema.titleField}`]: [
          {
            "type": "string",
            "analyzer":"lucene.standard",
            "multi": {
              "keywordAnalyzer": {
                "type": "string",
                "analyzer": "keyword"
              }
            }
          }
        ]
      }
    },
    "analyzers": [
      {
        "charFilters": [],
        "name": "keyword",
        "tokenFilters": [
          {
            "type": "lowercase"
          }
        ],
        "tokenizer": {
          "type": "keyword"
        }
      }
    ]
  }
  
}

for(const searchField of schema.searchFields){
  searchIndex.definition.mappings.fields[searchField] = {
    "type": "string",
    "analyzer":"lucene.standard",
    "multi": {
      "keywordAnalyzer": {
        "type": "string",
        "analyzer": "keyword"
      },
      "standardAnalyzer": {
        "type": "string",
        "analyzer": "lucene.standard"
      }
    }
  }
}
const vectorIndex = {
  name: "vectorIndex",
  type: "vectorSearch",
  definition: {
    "fields": [
      {
        "type": "vector",
        "path": `${schema.vectorField}`,
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

async function create(collection,index){
  try{
    await collection.createSearchIndex(index);
  }catch(error){
    if(error instanceof MongoError && error.codeName == 'IndexAlreadyExists'){
      console.log(`Index ${index.name} already exists`);
    }
    else{
      console.log(`Creating index ${index.name} failed ${error}`);
      throw error;
    }
  }
}

try{
  const client = new MongoClient(process.env.MDBCONNSTR);
  try{
      await client.connect();
      try{
        const db = client.db(MDB_DB);
        const collection = db.collection(MDB_COLL);
        await create(collection,searchIndex);
        await create(collection,vectorIndex);
        console.log('Existing search indexes...');
        const indexes = await collection.listSearchIndexes().toArray();
        for(const index of indexes){
          console.log(index.name,'\t',index.status);
        }
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
