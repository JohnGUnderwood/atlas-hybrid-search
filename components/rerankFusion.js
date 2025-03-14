// Reciprocal Rank Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import SetParams from "./set-params";
import { useToast } from '@leafygreen-ui/toast';
import {searchStage} from "../lib/pipelineStages";
import {useApp} from "../context/AppContext";
function RerankFusion({query,queryVector}){
    const { pushToast } = useToast();
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const {schema} = useApp();
    // CONFIGURATION PARAMETERS
    const defaultConfig = {      
      k : {val:10,range:[1,25],step:1,comment:"Number of user facing results"},
      request_text_results : {val:20,range:[1,50],step:1,comment:"Number of text search results"},
      request_vector_results : {val:20,range:[1,50],step:1,comment:"Number of vector search results"},
      vector_num_candidates : {val:10,range:[1,25],step:1,comment:"Multiply 'k' for numCandidates"}
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
              setResponse(resp);
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
          <SetParams loading={loading} config={config} resetConfig={resetConfig} handleSliderChange={handleSliderChange} heading="Rerank Fusion Params"/>
          <Results queryText={query} schema={schema} response={response} msg={`Text Search: ${config.request_text_results.val} Vector Search: ${config.request_vector_results.val}`} hybrid={true} noResultsMsg={"No Results. Select 'Vector Search' to run a vector query."} rerankOpt={false}/>
      </div>
    )
}

export default RerankFusion;

async function search(query,queryVector,schema,config) {
    
    const pipeline = [
        {
          $vectorSearch: {
            index: '',
            path: `${schema.vectorField}`,
            queryVector: queryVector,
            numCandidates: config.vector_num_candidates.val * config.request_vector_results.val,
            limit: config.request_vector_results.val
          }
        },       
        {
          $addFields: {
            vs_score: {
              $meta: 'vectorSearchScore'
            }
          }
        },
        {
          $project: {
            vs_score: 1, 
            _id: 1, 
            title: `$${schema.titleField}`,
            image: `$${schema.imageField}`,
            description: `$${schema.descriptionField}`,
            ...schema.searchFields.reduce((acc, f) => ({...acc, [f]: 1}), {})
          }
        },
        {
          $unionWith: {
            coll: '',
            pipeline: [
              searchStage(query,schema),
              {
                $limit: config.request_text_results.val
              },              
              {
                $addFields: {
                  fts_score: {
                    $meta: 'searchScore'
                  }
                }
              },
              {
                $project: {
                    fts_score: 1,
                    _id: 1,
                    title: `$${schema.titleField}`,
                    image: `$${schema.imageField}`,
                    description: `$${schema.descriptionField}`,
                    ...schema.searchFields.reduce((acc, f) => ({...acc, [f]: 1}), {})
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
    ]

    const searchPromise = new Promise((resolve,reject) => {
        axios.post(`api/search`,
            { 
              pipeline : pipeline
            },
        ).then(response => {
            console.log(response.data);
            return axios.post(`api/rerank`, 
                {
                    query: query,
                    documents: response.data.results,
                });
        })
        .then(rerankResponse => {
            // trim array to k results            
            resolve({results: rerankResponse.data.slice(0,config.k.val), query: pipeline, time: 0});
        })
        .catch((error) => {
            reject(error.response?.data?.error || error.message);
        });
    });

    return searchPromise;
}
