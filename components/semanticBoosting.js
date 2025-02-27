// Semantic Boosting - boost lexical search with vector search results
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import SetParams from "./set-params";
import { useToast } from '@leafygreen-ui/toast';
import searchStage from "./searchStage";
import ScalarSlider from "./scalarSlider";
import projectStage from "./projectStage";

function SemanticBoosting({query,queryVector,schema}){
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
            search(query,queryVector,schema,config,numCandidates)
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
                <Results schema={schema} response={response} msg={"numCandidates: "+numCandidates} hybrid={false} noResultsMsg={"No Results. Select 'Vector Search' to run a vector query."}/>
            </div>
        </div>
    )
}

export default SemanticBoosting;

async function search(query,queryVector,schema,config,numCandidates) {
    const vector_pipeline = [
        {
            $vectorSearch: {
                index: '',
                path: `${schema.vectorField}`,
                queryVector: queryVector,
                numCandidates: numCandidates,
                limit: config.vector_results.val

            }
        },
        {
            $project: {
                _id:0,
                field:"_id",
                value:"$_id",
                score: {$meta: "vectorSearchScore"}
            }
        },
        {
            $match:{
                score:{$gte:config.vector_score_cutoff.val}
            }
        }
    ];
    let vector_boosts = [];
    let boost_scores = {};
    let boost_ids = [];
    try{
        const vector_results = await axios.post(`api/search`,{pipeline : vector_pipeline});
        vector_boosts = vector_results.data.results.map(r => {
            return {
                field: r.field,
                value: r.value,
                score: r.score*config.vector_weight.val
            }
        });
        boost_scores = Object.fromEntries(vector_results.data.results.map(b => [b.value,b.score]));
        boost_ids = vector_results.data.results.map(b => b.value);

        var project =  projectStage(schema);
        project.$project.boost = {$in:[{$toString:"$_id"},boost_ids]};         
        const lexical_pipeline = [
            searchStage(query,schema),
            project,
            {$limit: config.k.val}
        ];
        var response = await axios.post(`api/search`,
            { 
                pipeline : lexical_pipeline,
                boosts:vector_boosts,
            });
        const modifiedResults = response.data.results.map(r => {r.vectorScore = boost_scores[r._id]; return r});
        response.data.results = modifiedResults;
        return response;
    }catch(error){
        throw error?.response?.data?.error || error;
    };
}