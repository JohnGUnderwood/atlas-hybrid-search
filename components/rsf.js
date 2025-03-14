// Relative Score Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import SetParams from "./set-params";
import { useToast } from '@leafygreen-ui/toast';
import {searchStage} from "../lib/pipelineStages";

function RSF({query,queryVector}){
    const { pushToast } = useToast();
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);

    // CONFIGURATION PARAMETERS
    const defaultConfig = {
        vector_scalar : {val:0.9,range:[0,1],step:0.1,comment:"Vector search score scaling factor (1 - fts_scalar)"},
        fts_scalar : {val:0.1,range:[0,1],step:0.1,comment:"FTS score scaling factor (1 - vector_scalar)"}, 
        k : {val:10,range:[1,25],step:1,comment:"Number of results"},
        overrequest_factor : {val:10,range:[1,25],step:1,comment:"Multiply 'k' for numCandidates"}
    }
    const [config, setConfig] = useState(defaultConfig)
    const resetConfig = () => {
        setConfig(defaultConfig);
    }

    const handleSliderChange = (param, newValue) => {
        if(param == "fts_scalar"){
            setConfig({
                ...config,
                fts_scalar: {
                  ...config.fts_scalar,
                  val:parseFloat(newValue)
                },
                vector_scalar: {
                    ...config.vector_scalar,
                    val: parseFloat(1-newValue)
                }
              });
        }else if(param == "vector_scalar"){
            setConfig({
                ...config,
                vector_scalar: {
                  ...config.vector_scalar,
                  val:parseFloat(newValue)
                },
                fts_scalar: {
                    ...config.fts_scalar,
                    val: parseFloat(1-newValue)
                }
              });
        }else{
            setConfig({
                ...config,
                [param]: {
                  ...config[param],
                  val:parseFloat(newValue)
                }
              });
        }
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
            <SetParams loading={loading} config={config} resetConfig={resetConfig} handleSliderChange={handleSliderChange} heading="Relative Score Fusion Params"/>
            <Results queryText={query} response={response} msg={"numCandidates: "+(config.k.val * config.overrequest_factor.val)} hybrid={true} noResultsMsg={"No Results. Select 'Vector Search' to run a vector query."}/>
        </div>
    )
}

export default RSF;

async function search(query,queryVector,config) {
    
    return new Promise((resolve,reject) => {
        axios.post(`api/search/rsf`,
            { 
                query: query,
                queryVector: queryVector,
                config: config
            },
        ).then(response => resolve(response))
        .catch((error) => {
            reject(error.response.data.error);
        })
    });
}