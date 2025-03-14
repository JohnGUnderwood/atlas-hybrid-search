// /api/search/rsf route
import {searchStage, projectStage} from "../../../lib/pipelineStages";
import getResults from "../../../lib/getResults";
import { baseRouter } from "../../../middleware/router";

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
        
        const pipeline = [
            {
              $vectorSearch: {
                index: '',
                path: `${req.schema.vectorField}`,
                queryVector: queryVector,
                numCandidates: config.k.val * config.overrequest_factor.val,
                limit: config.k.val * 2
              }
            },
            {
              $group: {
                _id: null,
                docs: {$push: "$$ROOT"}
              }
            },
            {
              $unwind: {
                path: "$docs", 
                includeArrayIndex: "rank"
              }
            },
            {
              $addFields: {
                vs_score: {
                  $divide: [1.0, {$add: ["$rank", config.vector_penalty.val, 1]}]
                }
              }
            },
            {
              $project: {
                vs_score: 1, 
                _id: "$docs._id", 
                title:`$docs.${req.schema.titleField}`,
                image:`$docs.${req.schema.imageField}`,
                description:`$docs.${req.schema.descriptionField}`,
                ...req.schema.searchFields.reduce((acc, f) => ({...acc, [f]: `$docs.${f}`}), {})
              }
            },
            {
              $unionWith: {
                coll: '',
                pipeline: [
                  searchStage(query,req.schema),
                  {
                    $limit: config.k.val
                  },
                  {
                    $group: {
                      _id: null,
                      docs: {$push: "$$ROOT"}
                    }
                  },
                  {
                    $unwind: {
                      path: "$docs", 
                      includeArrayIndex: "rank"
                    }
                  },
                  {
                    $addFields: {
                      fts_score: {
                        $divide: [
                          1.0,
                          {$add: ["$rank", config.fts_penalty.val, 1]}
                        ]
                      }
                    }
                  },
                  {
                    $project: {
                        fts_score: 1,
                        _id:"$docs._id",
                        title:`$docs.${req.schema.titleField}`,
                        image:`$docs.${req.schema.imageField}`,
                        description:`$docs.${req.schema.descriptionField}`,
                        ...req.schema.searchFields.reduce((acc, f) => ({...acc, [f]: `$${f}`}), {})
                    }
                  }
                ]
              }
            },
            {
              $group: {
                _id: "$_id",
                vs_score: {$max: "$vs_score"},
                fts_score: {$max: "$fts_score"},
                title:{$first:"$title"},
                image:{$first:"$image"},
                description:{$first:"$description"},
                ...req.schema.searchFields.reduce((acc, f) => ({...acc, [f]: {$first:`$${f}`}}), {})
              }
            },
            {
              $project: {
                _id: 1,
                title: 1,
                image:1,
                description:1,
                vs_score: {$ifNull: ["$vs_score", 0]},
                fts_score: {$ifNull: ["$fts_score", 0]},
                ...req.schema.searchFields.reduce((acc, f) => ({...acc, [f]: `$${f}`}), {})
              }
            },
            {
              $addFields:{
                  score: {
                      $add: ["$fts_score", "$vs_score"],
                  },
              }
            },
            {$sort: {score: -1}},
            {$limit: config.k.val}
        ]
        try{
            const response = await getResults(req.collection,pipeline,searchIndex,vectorIndex);
            res.status(200).json(response);
        }catch(error){
            res.status(405).json({'error':`${error}`,query:pipeline});
        }
    }

});

export default router.handler();