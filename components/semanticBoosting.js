// Semantic Boosting - boost lexical search with vector search results
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import SetParams from "./set-params";
import { useToast } from '@leafygreen-ui/toast';
import ScalarSlider from "./scalarSlider";

function SemanticBoosting({query,queryVector}){
    const { pushToast } = useToast();
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);

    // CONFIGURATION PARAMETERS
    const defaultConfig = {
        vector_results : {val:20,range:[1,100],step:1,comment:"How many vector results to fetch"},
        k : {val:10,range:[1,25],step:1,comment:"Number of final results"},
        overrequest_factor : {val:10,range:[1,25],step:1,comment:"Multiply 'k' for numCandidates"},
        vector_weight : {val:1,range:[1,9],step:1,comment:"Weight the vector score before boosting"},
        vector_score_cutoff : {val:0.7,range:[0,0.99],step:0.01,comment:"Minimum vector score for result to be boosted"}
    }
    const [config, setConfig] = useState(defaultConfig)
    const [scalar, setScalar] = useState(1);
    const [numCandidates, setNumCandidates] = useState(Math.min(defaultConfig.k.val * defaultConfig.overrequest_factor.val,10000));
    const resetConfig = () => {
        setConfig(defaultConfig);
        setScalar(1);
    }

    const handleSliderChange = (param, newValue) => {
        setConfig(prevConfig => ({
            ...prevConfig,
            [param]: {
                ...config[param],
                val:parseFloat(newValue)
            }
            }));
      };
    

    const handleScalarChange = (value) => {
        value = parseFloat(value);
        setScalar(value);
        const vector_results = value*10;
        const overrequest_factor = defaultConfig.overrequest_factor.val*vector_results;
        const vector_weight = value;
        const vector_score_cutoff = (1-value/10);
        setConfig(prevConfig =>({
            ...prevConfig,
            vector_results: {...prevConfig.vector_results,val:vector_results},
            overrequest_factor: {...prevConfig.overrequest_factor,val:overrequest_factor},
            vector_weight: {...prevConfig.vector_weight,val:vector_weight},
            vector_score_cutoff: {...prevConfig.vector_score_cutoff,val:vector_score_cutoff}
        }));
    };

    useEffect(() => {
        if(queryVector){
            setLoading(true);
            search(query,queryVector,config,numCandidates)
            .then(resp => {
              setResponse(resp.data);
              setLoading(false);
            })
            .catch(error => {
              pushToast({timeout:10000,variant:"warning",title:"API Failure",description:`Search query failed. ${error}`});
              console.log(error);
            });
        }
        setNumCandidates(Math.min(config.k.val * config.overrequest_factor.val,10000));
    
    },[queryVector,config]);

    return (
        <div style={{display:"grid",gridTemplateColumns:"20% 80%",gap:"5px",alignItems:"start"}}>
            <SetParams loading={loading} config={config} resetConfig={resetConfig} handleSliderChange={handleSliderChange} heading="Semantic Boosting Params"/>
            <div>
                <br/>
                <ScalarSlider value={scalar} handleSliderChange={handleScalarChange} labels={['Search for just these words','Search for similar meanings (semantic search)']} step={0.1} minMax={[1,10]}/>
                <Results queryText={query} response={response} msg={"numCandidates: "+numCandidates} hybrid={false} noResultsMsg={"No Results. Select 'Vector Search' to run a vector query."}/>
            </div>
        </div>
    )
}

export default SemanticBoosting;

async function search(query,queryVector,config,numCandidates) {
    config.numCandidates = numCandidates;
    return new Promise((resolve,reject) => {
        axios.post(`api/search/semantic-boosting`,
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