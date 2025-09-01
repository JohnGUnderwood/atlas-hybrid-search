// Reciprocal Rank Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import SetParams from "./set-params";
import { useToast } from '@leafygreen-ui/toast';
import { useApp } from "../context/AppContext";
import {searchStage} from "../lib/pipelineStages";

function RRF({query,queryVector}){
    const { pushToast } = useToast();
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const {schema} = useApp();
    // CONFIGURATION PARAMETERS
    const defaultConfig = {
      vector_weight : {type:"range",val:1,range:[0,20],step:1,comment:"Weight the vector results"},
      fts_weight : {type:"range",val:1,range:[0,20],step:1,comment:"Weight the text results"}, 
      limit : {type:"range",val:10,range:[1,25],step:1,comment:"Number of results to return"},
      numCandidates : {type:"range",val:100,range:[1,625],step:1,comment:"How many candidates to retrieve from the vector search"},
    }
    const [config, setConfig] = useState(defaultConfig)
    const resetConfig = () => {
        setConfig(defaultConfig);
    }

    useEffect(() => {
        if(queryVector){
          setLoading(true);
            search(query,queryVector,config,schema)
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
          <SetParams loading={loading} config={config} resetConfig={resetConfig} setConfig={setConfig} heading="Reciprocal Rank Fusion Params"/>
          <Results queryText={query} response={response} msg={"numCandidates: "+(config.numCandidates.val)} hybrid={true} noResultsMsg={"No Results. Select 'Vector Search' to run a vector query."}/>
      </div>
    )
}

export default RRF;

async function search(query,queryVector,config,schema) {
    const pipeline = [
      {
        $rankFusion: {
          input:{
            pipelines:{
              vectorPipeline:[
                {
                  $vectorSearch: {
                    index: '',
                    path: `${schema.vectorField}`,
                    queryVector: queryVector,
                    numCandidates: config.numCandidates.val,
                    limit: config.limit.val
                  }
                },
              ],
              fullTextPipeline:[
                searchStage(query,schema),
                {
                  $limit: config.limit.val
                }
              ]
            }
          },
          combination:{
            weights:{
              vectorPipeline: config.vector_weight.val,
              fullTextPipeline: config.fts_weight.val
            }
          },
          scoreDetails:true
        }
      },
      {
        $addFields:{
          scoreDetails:{ $meta: "scoreDetails" }
        }
      },
      {
        $addFields: {
          vs_score_details: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$scoreDetails.details",
                  as: "item",
                  cond: { $eq: ["$$item.inputPipelineName", "vectorPipeline"] }
                }
              },
              0
            ]
          },
          fts_score_details: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$scoreDetails.details",
                  as: "item",
                  cond: { $eq: ["$$item.inputPipelineName", "fullTextPipeline"] }
                }
              },
              0
            ]
          },
          score:"$scoreDetails.value"
        }
      },
      {
        $addFields: {
          vs_score: {
            $cond: [
              { $and:[{$ifNull: ["$vs_score_details", false] },{$ne: ["$vs_score_details.rank", 0]}] },
              { $multiply: ["$vs_score_details.weight",{$divide:[1,{$add:[60,"$vs_score_details.rank"]}]}] },
              0
            ]
          },
          fts_score: {
            $cond: [
              { $and:[{$ifNull: ["$fts_score_details", false] },{$ne: ["$fts_score_details.rank", 0]}] },
              { $multiply: ["$fts_score_details.weight",{$divide:[1,{$add:[60,"$fts_score_details.rank"]}]}] },
              0
            ]
          }
        }
      },
      {
        $project: {
            _id:1,
            vs_score:1,
            fts_score:1,
            score:1,
            scoreDetails:1,
            title:`$${schema.titleField}`,
            image:`$${schema.imageField}`,
            description:`$${schema.descriptionField}`,
            ...schema.searchFields.reduce((acc, f) => ({...acc, [f]: `$${f}`}), {})
        }
      },
    ]
    return new Promise((resolve,reject) => {
        axios.post(`api/search`,
            { 
              pipeline:pipeline
            },
        ).then(response => resolve(response))
        .catch((error) => {
            reject(error.response.data.error);
        })
    });
}
