import { MongoClient } from 'mongodb';
import { createRouter } from 'next-connect';

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

async function mongodb(){
    const uri = process.env.MDBCONNSTR;
    const db = process.env.MDB_DB ? process.env.MDB_DB : "sample_mflix";
    const coll = process.env.MDB_COLL ? process.env.MDB_COLL : "embedded_movies";
    console.log(db,coll);
    try{
        const thisClient = new MongoClient(uri);
        try{
            await thisClient.connect();
            try{
                var check = await checkCollections(thisClient,db,coll);
                if(check){
                    return {client:thisClient,db:db,coll:coll};
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

async function middleware(req, res, next) {
    const database = await mongodb();
    req.dbClient = database.client;
    req.db = req.dbClient.db(database.db);
    req.collection = req.db.collection(database.coll);
    return next();
}

const database = createRouter();
database.use(middleware);

export default database;