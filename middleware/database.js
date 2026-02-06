import { MongoClient } from 'mongodb';
import { createRouter } from 'next-connect';
import config from '../config.mjs';
import dotenv from 'dotenv';
dotenv.config({override:true});

async function checkCollections(client,db,coll){
    const collections = await client.db(db).listCollections().toArray()
    var check = false;
    if(collections.length > 0){
        collections.forEach(collection => {
            if(coll == collection.name){
                check = true;
            }
        })
        return check;
    }else{
        console.log(`No collections found in database: ${db}`,{cause:"EmptyDatabase"})
        throw new Error(`No collections found in database: ${db}`,{cause:"EmptyDatabase"})
    }
}

async function getSearchIndex(client,db,coll,indexName){
    const indexes = await client.db(db).collection(coll).listSearchIndexes(indexName).toArray();
    if(indexes.length > 0){
        var definition = indexes[0]['latestDefinition'];
        definition.name = indexName;
        return definition;
    }else{
        console.log(`No index ${indexName} found in collection: ${coll}`,{cause:"NoSearchIndexes"})
        throw new Error(`No indexes found in collection: ${coll}`,{cause:"NoSearchIndexes"})
    }
}

async function mongodb(){
    const uri = process.env.MDBCONNSTR;
    const db = process.env.MDB_DB ? process.env.MDB_DB : "sample_mflix";
    const coll = process.env.MDB_COLL ? process.env.MDB_COLL : "movies_embedded_ada";
    const searchIndex = process.env.MDB_SEARCHIDX ? process.env.MDB_SEARCHIDX : "searchIndex";
    try{
        const thisClient = new MongoClient(uri);
        try{
            await thisClient.connect();
            try{
                var check = await checkCollections(thisClient,db,coll);
                if(check){
                    var searchIndexDef = null;
                    try{
                        searchIndexDef = await getSearchIndex(thisClient,db,coll,searchIndex);
                    }
                    catch(error){
                        console.log(`Fetching index failed ${error}`)
                        throw error;
                    }
                    return {client:thisClient,db:db,coll:coll,searchIndex:searchIndexDef};
                }else{
                    console.log(`Collection '${coll}' not found in '${db}'`)
                    throw new Error(`Collection '${coll}' not found in '${db}'`,{cause:"CollectionNotFound"})
                }
            }catch(error){
                throw error;
            }
        }catch(error){
            throw error;
        }
    }catch(error){
        console.log(`Connection failed ${error}`)
        throw error;
    }
}

let connection;

async function middleware(req, res, next) {
    if (!connection) {
        connection = await mongodb();
    }
    req.dbClient = connection.client;
    req.db = req.dbClient.db(connection.db);
    req.collection = req.db.collection(connection.coll);
    req.searchIndex = connection.searchIndex;

    const schemaName = process.env.SCHEMA ? process.env.SCHEMA : "default";
    req.schema = config[schemaName]; 
    console.log(`Connected to database: ${connection.db}\ncollection: ${connection.coll}\nsearchIndex: ${connection.searchIndex.name}\nschema: ${schemaName}`)
    return next();
}

const database = createRouter();
database.use(middleware);

export default database;