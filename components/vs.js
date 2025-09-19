// Relative Score Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import SetParams from "./set-params";
import { useToast } from '@leafygreen-ui/toast';
import {useApp} from "../context/AppContext";
function VS({query,queryVector}){
    const { pushToast } = useToast();
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const {schema} = useApp();
    // CONFIGURATION PARAMETERS
    const defaultConfig = {
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
            search(queryVector,schema,config)
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
            <SetParams loading={loading} config={config} resetConfig={resetConfig} setConfig={setConfig} heading="Vector Search Params"/>
            <Results queryText={query} response={response} msg={"numCandidates: "+(config.numCandidates.val)} noResultsMsg={"No Results. Select 'Vector Search' to run a vector query."}/>
        </div>
    )
}

export default VS;

async function search(queryVector,schema,config) {
    const pipeline = [
        {
            $vectorSearch: {
                index: '',
                path: `${schema.vectorField}`,
                queryVector: queryVector,
                numCandidates: config.numCandidates.val,
                limit: config.limit.val
            }
        },
        {
            $project: {
                score: {$meta: "vectorSearchScore"},
                title:`$${schema.titleField}`,
                image:`$${schema.imageField}`,
                description:`$${schema.descriptionField}`,
                ...schema.searchFields.reduce((acc, f) => ({...acc, [f]: `$${f}`}), {})
            }
        }
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