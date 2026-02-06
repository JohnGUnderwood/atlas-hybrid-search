// Reciprocal Rank Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import SetParams from "./set-params";
import { useToast } from '@leafygreen-ui/toast';
import { useApp } from "../context/AppContext";
import {searchStage,vectorSearchStage} from "../lib/pipelineStages";
import LoadingIndicator from "./LoadingIndicator";

function RRF({query,queryVector}){
    const { pushToast } = useToast();
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const {schema} = useApp();
    // CONFIGURATION PARAMETERS
    const defaultConfig = {
      combination_method : {type:"hidden",val:"rank"},
      vector_weight : {type:"range",val:1,range:[0,20],step:1,comment:"Weight the vector results"},
      fts_weight : {type:"range",val:1,range:[0,20],step:1,comment:"Weight the text results"}, 
      limit : {type:"range",val:10,range:[1,25],step:1,comment:"Number of results to return"},
      numCandidates : {type:"range",val:100,range:[1,625],step:1,comment:"How many candidates to retrieve from the vector search"},
      enablePrefilter : {type:"checkbox",val:false,comment:"Enable lexical prefiltering for vector search"}
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
        }else{
          setResponse(prev => {
            return {
              ...prev,
              results: []
            };
          });
        }
    },[queryVector,config]);

    return (
      <div style={{display:"grid",gridTemplateColumns:"20% 80%",gap:"5px",alignItems:"start"}}>
          <SetParams loading={loading} config={config} resetConfig={resetConfig} setConfig={setConfig} heading="Reciprocal Rank Fusion Params"/>
          {loading
            ?<LoadingIndicator description="Loading..."/>
            :<Results queryText={query} response={response} msg={"numCandidates: "+(config.numCandidates.val)} hybrid={true} noResultsMsg={"No Results. Select 'Vector Search' to run a vector query."}/>
          }
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
                vectorSearchStage(
                  queryVector,
                  schema,
                  config.numCandidates.val,
                  config.limit.val,
                  config.enablePrefilter.val,
                  query
                )
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
        $project: {
            _id:1,
            score:"$scoreDetails.value",
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
        ).then(response => {response.data.config = config;resolve(response)})
        .catch((error) => {
            reject(error.response.data.error);
        })
    });
}
