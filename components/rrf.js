// Reciprocal Rank Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import SetParams from "./set-params";
import { useToast } from '@leafygreen-ui/toast';
import {searchStage} from "../lib/pipelineStages";

function RRF({query,queryVector}){
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
            search(query,queryVector,config)
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
          <Results queryText={query} response={response} msg={"numCandidates: "+(config.k.val * config.overrequest_factor.val)} hybrid={true} noResultsMsg={"No Results. Select 'Vector Search' to run a vector query."}/>
      </div>
    )
}

export default RRF;

async function search(query,queryVector,config) {

    return new Promise((resolve,reject) => {
        axios.post(`api/search/rrf`,
            { 
              query:query,
              queryVector:queryVector,
              config:config,
            },
        ).then(response => resolve(response))
        .catch((error) => {
            reject(error.response.data.error);
        })
    });
}
