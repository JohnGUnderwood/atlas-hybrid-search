// /api/search/semantic-boosting route
import {searchStage, projectStage} from "../../../lib/pipelineStages";
import getResults from "../../../lib/getResults";
import { baseRouter } from "../../../middleware/router";
import { ObjectId } from 'mongodb';

const router = baseRouter.clone();
router.post(async (req, res) => {
    if(!req.body.config || !req.body.queryVector || !req.body.query){
        console.log(`Request missing required data fields: 'query' or 'queryVector' or 'config'`)
        res.status(400).send(`Request missing required data fields: 'query' or 'queryVector' or 'config'`);
    }else{
        const searchIndex = req.searchIndex.name;
        const vectorIndex = req.vectorIndex.name;
        const query = req.body.query;
        const queryVector = req.body.queryVector;
        const config = req.body.config;
        
        const vector_pipeline = [
            {
                $vectorSearch: {
                    index: '',
                    path: `${req.schema.vectorField}`,
                    queryVector: queryVector,
                    numCandidates: config.numCandidates,
                    limit: config.vector_results.val
    
                }
            },
            {
                $project: {
                    _id:0,
                    field:"_id",
                    value:"$_id",
                    score: {$meta: "vectorSearchScore"}
                }
            },
            {
                $match:{
                    score:{$gte:config.vector_score_cutoff.val}
                }
            }
        ];
        let vector_boosts = [];
        let boost_scores = {};
        let boost_ids = [];
        let lexical_pipeline;

        try{
            const vector_results = await getResults(req.collection,vector_pipeline,searchIndex,vectorIndex);
            vector_boosts = vector_results.results.map(r => {
                return {
                    field: r.field,
                    value: r.value,
                    score: r.score*config.vector_weight.val
                }
            });
            boost_scores = Object.fromEntries(vector_results.results.map(b => [b.value,b.score]));
            boost_ids = vector_results.results.map(b => b.value);
            var project =  projectStage(req.schema);
            project.$project.boost = {$in:["$_id",boost_ids]};         
            const lexical_pipeline = [
                searchStage(query,req.schema),
                project,
                {$limit: config.k.val}
            ];
            vector_boosts.forEach((boost) => {
                // const value = ObjectId.createFromHexString(boost.value);
                lexical_pipeline[0].$search.compound.should.push(
                    {
                        equals:{
                            path:boost.field,
                            value:boost.value,
                            score:{boost:{value:boost.score}}
                        }
                    }
                )
            });
            const response = await getResults(req.collection,lexical_pipeline,searchIndex,vectorIndex);
            const modifiedResults = response.results.map(r => {r.vectorScore = boost_scores[r._id]; return r});
            response.results = modifiedResults;
            res.status(200).json(response);
        }catch(error){
            res.status(405).json({'error':`${error}`,query:lexical_pipeline?lexical_pipeline:vector_pipeline});
        }
    }

});

export default router.handler();