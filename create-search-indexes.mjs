import { MongoClient, MongoError } from 'mongodb';
import dotenv from 'dotenv';
import config from './config.mjs';
dotenv.config({override:true});

const schema = config[`${process.env.SCHEMA || "default"}`];
console.log("Schema: ", schema);
const searchIndex = {
  name:process.env.MDB_SEARCHIDX ? process.env.MDB_SEARCHIDX : "searchIndex",
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
  name: process.env.MDB_VECTORIDX ? process.env.MDB_VECTORIDX : "vectorIndex",
  type: "vectorSearch",
  definition: {
    "fields": [
      {
        "type": "vector",
        "path": `${schema.vectorField}`,
        "numDimensions": process.env.DIMENSIONS?parseInt(process.env.DIMENSIONS):1536,
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

// Deep merge for nested objects
function deepMerge(target, source) {
  for (const key in source) {
      if (Array.isArray(source[key]) && Array.isArray(target[key])) {
          // Concatenate arrays
          source[key] = [...target[key], ...source[key]];
      } else if (source[key] instanceof Object && key in target) {
          // Handle nested objects
          Object.assign(source[key], deepMerge(target[key], source[key]));
      }
  }
  return { ...target, ...source };
}

async function create(collection,index){
  try{
    await collection.createSearchIndex(index);
  }catch(error){
    if(error instanceof MongoError && error.codeName == 'IndexAlreadyExists'){
      console.log(`Index ${index.name} already exists`);
      try{
        console.log(`Updating search index`);
        const existingIndex = await collection.listSearchIndexes(index.name).toArray();
        console.log('Previous index',existingIndex[0].latestDefinition);
        const newIndex = deepMerge(index.definition,existingIndex[0].latestDefinition);
        console.log('New index',newIndex);
        await collection.updateSearchIndex(index.name,newIndex);
      }catch(error){
        console.log(`Updating index ${index.name} failed ${error}`);
        throw error;
      }
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
