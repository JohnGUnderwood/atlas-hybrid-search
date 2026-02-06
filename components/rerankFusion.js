// Rerank Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import SetParams from "./set-params";
import { useToast } from '@leafygreen-ui/toast';
import {searchStage,vectorSearchStage} from "../lib/pipelineStages";
import {useApp} from "../context/AppContext";
import LoadingIndicator from "./LoadingIndicator";

function RerankFusion({query,queryVector}){
    const { pushToast } = useToast();
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const {schema} = useApp();
    // CONFIGURATION PARAMETERS
    const defaultConfig = {    
      combination_method : {type:"hidden",val:"rerank"},  
      textLimit : {type:"range",val:20,range:[1,50],step:1,comment:"Number of text search results"},
      limit : {type:"range",val:20,range:[1,50],step:1,comment:"Number of vector search results"},
      show : {type:"range",val:10,range:[1,25],step:1,comment:"Number of user-facing results to return"},
      numCandidates : {type:"range",val:100,range:[1,625],step:1,comment:"How many candidates to retrieve from the vector search"},
      enablePrefilter : {type:"multi",val:"none",options:["none","any","all"],comment:"Filter vector search by keywords"}
    }

    const [config, setConfig] = useState(defaultConfig)
    const resetConfig = () => {
        setConfig(defaultConfig);
    }

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
          <SetParams loading={loading} config={config} resetConfig={resetConfig} setConfig={setConfig} heading="Rerank Fusion Params"/>
          {loading
            ?<LoadingIndicator description="Loading..."/>
            :<Results queryText={query} schema={schema} response={response} msg={`Text Search: ${config.textLimit.val} Vector Search: ${config.limit.val}`} hybrid={false} noResultsMsg={"No Results. Select 'Vector Search' to run a vector query."} rerankOpt={false}/>
          }
      </div>
    )
}

export default RerankFusion;

async function search(query,queryVector,schema,config) {
    
    const pipeline = [
        vectorSearchStage(
            queryVector,
            schema,
            config.numCandidates.val,
            config.limit.val,
            config.enablePrefilter.val,
            query
        ),
        {
          $project: {
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
                $limit: config.textLimit.val
              },
              {
                $project: {
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
            ...schema.searchFields.reduce((acc, f) => ({...acc, [f]: `$${f}`}), {})
          }
        },
    ]

    const searchPromise = new Promise((resolve,reject) => {
        axios.post(`api/search`,
            { 
              pipeline : pipeline
            },
        ).then(response => {
            return axios.post(`api/rerank`, {
                query: query,
                documents: response.data.results,
            }).then(rerankResponse => ({
              response,
              rerankResponse
            }));;
        })
        .then(({response, rerankResponse}) => {
            // trim array to k results
            var results = rerankResponse.data.results.slice(0,config.show.val);
            // use re-rank score as score and remove re-rank flag for UI purposes
            results = results.map((doc) => ({...doc, score: doc.rerank_score, reranked: undefined}));
            // Add both times together
            resolve({
                results: results,
                query: pipeline,
                time: response.data.time + rerankResponse.data.time,
                config: config
            });
        })
        .catch((error) => {
            reject(error.response?.data?.error || error.message);
        });
    });

    return searchPromise;
}
