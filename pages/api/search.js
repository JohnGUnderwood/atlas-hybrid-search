import { createRouter } from 'next-connect';
import database from '../../middleware/database';

const searchCollection = process.env.MDB_COLL ? process.env.MDB_COLL : "movies_embedded_ada";
const searchIndex = process.env.SEARCHIDX ? process.env.SEARCHIDX : "searchIndex";
const vectorIndex = process.env.VECTORIDX ? process.env.VECTORIDX : "vectorIndex";

function setVariables(pipeline){
    // This function sets search/vector index names and collection names in the pipeline.    
    try{
        var newPipeline = [];
        pipeline.forEach(stage => {
            if('$search' in stage){
                newPipeline.push({...stage,$search:{...stage.$search, index:searchIndex}})
            }else if('$vectorSearch' in stage){
                newPipeline.push({...stage,$vectorSearch:{...stage.$vectorSearch, index:vectorIndex}})
            }else if('$unionWith' in stage){
                newPipeline.push({...stage,$unionWith:{...stage.$unionWith,coll:searchCollection,pipeline:setVariables(stage.$unionWith.pipeline)}})
            }else{
                newPipeline.push(stage);
            }
        });
        return newPipeline;
    }catch(error){
        throw error;
    }   
}

async function getResults(collection,pipeline){
    try{
        const newPipeline = setVariables(pipeline);
        const results = await collection.aggregate(newPipeline).toArray();
        return {results:results,query:newPipeline};
    }catch(error){
        throw error
    }
}

const router = createRouter();

router.use(database);

router.post(async (req, res) => {
    if(!req.body.pipeline){
        console.log(`Request missing 'pipeline' data`)
        res.status(400).send(`Request missing 'pipeline' data`);
    }else{
        const pipeline = req.body.pipeline
        try{
            const response = await getResults(req.collection,pipeline);
            res.status(200).json(response);
        }catch(error){
            res.status(405).json({'error':`${error}`,query:pipeline});
        }
    }
});

export default router.handler();