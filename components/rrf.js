// Reciprocal Rank Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import SetParams from "./set-params";
import { useToast } from '@leafygreen-ui/toast';
import searchStage from "./searchStage";

function RRF({query,queryVector,schema}){
    const { pushToast } = useToast();
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);

    // CONFIGURATION PARAMETERS
    const defaultConfig = {
      vector_penalty : {val:1,range:[0,20],step:1,comment:"Penalise vector results score"},
      fts_penalty : {val:10,range:[0,20],step:1,comment:"Penalise text search results score"}, 
      k : {val:10,range:[1,25],step:1,comment:"Number of results"},
      overrequest_factor : {val:10,range:[1,25],step:1,comment:"Multiply 'k' for numCandidates"}
    }
    const [config, setConfig] = useState(defaultConfig)
    const resetConfig = () => {
        setConfig(defaultConfig);
    }

    const handleSliderChange = (param, newValue) => {
        setConfig({
            ...config,
            [param]: {
                ...config[param],
                val:parseFloat(newValue)
            }
            });
      };

    useEffect(() => {
        if(queryVector){
          setLoading(true);
            search(query,queryVector,schema,config)
            .then(resp => {
              setResponse(resp.data);
              setLoading(false);
            })
            .catch(error => {
              pushToast({timeout:10000,variant:"warning",title:"API Failure",description:`Search query failed. ${error}`});
              console.log(error);
            });
        }
    
    },[queryVector,config]);

    return (
      <div style={{display:"grid",gridTemplateColumns:"20% 80%",gap:"5px",alignItems:"start"}}>
          <SetParams loading={loading} config={config} resetConfig={resetConfig} handleSliderChange={handleSliderChange} heading="Reciprocal Rank Fusion Params"/>
          <Results queryText={query} schema={schema} response={response} msg={"numCandidates: "+(config.k.val * config.overrequest_factor.val)} hybrid={true} noResultsMsg={"No Results. Select 'Vector Search' to run a vector query."}/>
      </div>
    )
}

export default RRF;

async function search(query,queryVector,schema,config) {
    
    const pipeline = [
        {
          $vectorSearch: {
            index: '',
            path: `${schema.vectorField}`,
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
            title:`$docs.${schema.titleField}`,
            image:`$docs.${schema.imageField}`,
            description:`$docs.${schema.descriptionField}`,
            ...schema.searchFields.reduce((acc, f) => ({...acc, [f]: `$docs.${f}`}), {})
          }
        },
        {
          $unionWith: {
            coll: '',
            pipeline: [
              searchStage(query,schema),
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
                    title:`$docs.${schema.titleField}`,
                    image:`$docs.${schema.imageField}`,
                    description:`$docs.${schema.descriptionField}`,
                    ...schema.searchFields.reduce((acc, f) => ({...acc, [f]: `$${f}`}), {})
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
            ...schema.searchFields.reduce((acc, f) => ({...acc, [f]: {$first:`$${f}`}}), {})
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
            ...schema.searchFields.reduce((acc, f) => ({...acc, [f]: `$${f}`}), {})
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
    return new Promise((resolve,reject) => {
        axios.post(`api/search`,
            { 
            pipeline : pipeline
            },
        ).then(response => resolve(response))
        .catch((error) => {
            reject(error.response.data.error);
        })
    });
}
