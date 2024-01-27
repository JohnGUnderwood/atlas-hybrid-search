// Relative Score Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import SetParams from "./set-params";


function VS({queryVector,schema}){
    const [results, setResults] = useState(null);

    // CONFIGURATION PARAMETERS
    const defaultConfig = {
        k : {val:10,range:[1,25],step:1,comment:"Number of results"},
        overrequest_factor : {val:10,range:[1,25],step:1,comment:"Multiplication factor of k for numCandidates for HNSW search"}
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
            search(queryVector,schema,config)
            .then(resp => setResults(resp.data.results))
            .catch(error => console.log(error));
        }
    
    },[queryVector,config]);

    return (
        <div style={{display:"grid",gridTemplateColumns:"20% 80%",gap:"5px",alignItems:"start"}}>
            <SetParams config={config} resetConfig={resetConfig} handleSliderChange={handleSliderChange} heading="Vector Search Params"/>
            <Results results={results} msg={"numCandidates: "+(config.k.val * config.overrequest_factor.val)}/>
        </div>
    )
}

export default VS;

async function search(queryVector,schema,config) {
    const pipeline = [
        {
            $vectorSearch: {
                index: schema.vectorIndex,
                path: `${schema.vectorField}`,
                queryVector: queryVector,
                numCandidates: config.k.val * config.overrequest_factor.val,
                limit: config.k.val
            }
        },
        {
            $project: {
                score: {$meta: "searchScore"},
                title:`$${schema.titleField}`,
                image:`$${schema.imageField}`,
                description:`$${schema.descriptionField}`
            }
        }
    ]
    return new Promise((resolve) => {
        axios.post(`api/search`,
            { 
            pipeline : pipeline
            },
        ).then(response => resolve(response))
        .catch((error) => {
            console.log(error)
            resolve(error.response.data);
        })
    });
}