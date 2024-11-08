// Semantic Boosting - boost lexical search with vector search results
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import SetParams from "./set-params";
import { useToast } from '@leafygreen-ui/toast';
import searchStage from "./searchStage";

function SemanticBoosting({query,queryVector,schema}){
    const { pushToast } = useToast();
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);

    // CONFIGURATION PARAMETERS
    const defaultConfig = {
        vector_results : {val:20,range:[5,50],step:5,comment:"How many vector results to fetch"},
        overrequest_factor : {val:10,range:[1,25],step:1,comment:"Multiplication factor of k for numCandidates for HNSW search"},
        k : {val:10,range:[1,25],step:1,comment:"Number of final results"},
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
            <SetParams loading={loading} config={config} resetConfig={resetConfig} handleSliderChange={handleSliderChange} heading="Semantic Boosting Params"/>
            <Results response={response} msg={"numCandidates: "+(config.k.val * config.overrequest_factor.val)} hybrid={false} noResultsMsg={"No Results. Select 'Vector Search' to run a vector query."}/>
        </div>
    )
}

export default SemanticBoosting;

async function search(query,queryVector,schema,config) {
    const vector_pipeline = [
        {
            $vectorSearch: {
                index: '',
                path: `${schema.vectorField}`,
                queryVector: queryVector,
                numCandidates: config.k.val * config.overrequest_factor.val,
                limit: config.k.val
            }
        },
        {
            $project: {
                _id:0,
                field:"_id",
                value:"$_id",
                score: {$meta: "vectorSearchScore"}
            }
        }
    ];
    let vector_boosts = [];
    try{
        vector_boosts = await axios.post(`api/search`,{pipeline : vector_pipeline});
    }catch(error){
        return new Promise((resolve,reject) => {error.response.data.error});
    };

    const lexical_pipeline = [
        searchStage(query,schema),
        {
            $project: {
                score: {$meta: "searchScore"},
                title:`$${schema.titleField}`,
                image:`$${schema.imageField}`,
                description:`$${schema.descriptionField}`,
                ...schema.searchFields.reduce((acc, f) => ({...acc, [f]: `$${f}`}), {})
            }            
        },
        {$limit: config.k.val}
    ];
    return new Promise((resolve,reject) => {
        axios.post(`api/search`,
            { 
                pipeline : lexical_pipeline,
                boosts:vector_boosts.data.results,
            },
        ).then(response => resolve(response))
        .catch((error) => {
            reject(error.response.data.error);
        })
    });
}