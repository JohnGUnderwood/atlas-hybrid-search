// /api/search route

import { baseRouter } from "../../middleware/router";
import { ObjectId } from 'mongodb';

const searchCollection = process.env.MDB_COLL ? process.env.MDB_COLL : "movies_embedded_ada";
const searchIndex = process.env.MDB_SEARCHIDX ? process.env.MDB_SEARCHIDX : "searchIndex";
const vectorIndex = process.env.MDB_VECTORIDX ? process.env.MDB_VECTORIDX : "vectorIndex";

function setIndexNames(pipeline){
    // This function sets search/vector index names and collection names in the pipeline.    
    try{
        var newPipeline = [];
        pipeline.forEach(stage => {
            if('$search' in stage){
                newPipeline.push({...stage,$search:{...stage.$search, index:searchIndex}})
            }else if('$vectorSearch' in stage){
                newPipeline.push({...stage,$vectorSearch:{...stage.$vectorSearch, index:vectorIndex}})
            }else if('$unionWith' in stage){
                newPipeline.push({...stage,$unionWith:{...stage.$unionWith,coll:searchCollection,pipeline:setIndexNames(stage.$unionWith.pipeline)}})
            }else if('$rankFusion' in stage){
                Object.entries(stage['$rankFusion'].input.pipelines).forEach(([name, pipeline]) =>{
                    stage['$rankFusion'].input.pipelines[name] = setIndexNames(pipeline);
                })
                newPipeline.push(stage);
            }else if('$scoreFusion' in stage){
                Object.entries(stage['$scoreFusion'].input.pipelines).forEach(([name, pipeline]) =>{
                    stage['$scoreFusion'].input.pipelines[name] = setIndexNames(pipeline);
                })
                newPipeline.push(stage);
            }
            else{
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
        const newPipeline = setIndexNames(pipeline);
        // console.log(JSON.stringify(newPipeline,null,2));
        const start = new Date();
        const results = await collection.aggregate(newPipeline).toArray();
        const end   = new Date();
        const time = (end - start);
        return {results:results,query:newPipeline,time:time};
    }catch(error){
        throw error
    }
}

const router = baseRouter.clone();
router.post(async (req, res) => {
    if(!req.body.pipeline){
        console.log(`Request missing 'pipeline' data`)
        res.status(400).send(`Request missing 'pipeline' data`);
    }else{
        var pipeline = req.body.pipeline
        if(req.body.boosts && req.body.pipeline[0].$search){
            req.body.boosts.forEach((boost) => {
                const value = ObjectId.createFromHexString(boost.value);
                req.body.pipeline[0].$search.compound.should.push(
                    {
                        equals:{
                            path:boost.field,
                            value:value,
                            score:{boost:{value:boost.score}}
                        }
                    }
                )
            });
        }
        try{
            const response = await getResults(req.collection,pipeline);
            res.status(200).json(response);
        }catch(error){
            res.status(405).json({'error':`${error}`,query:pipeline});
        }
    }
});

export default router.handler();