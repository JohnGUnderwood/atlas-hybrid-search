// Relative Score Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import SetParams from "./set-params";
import { useToast } from '@leafygreen-ui/toast';
import {searchStage} from "../lib/pipelineStages";
import {useApp} from "../context/AppContext";
function RSF({query,queryVector}){
    const { pushToast } = useToast();
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const {schema} = useApp();
    // CONFIGURATION PARAMETERS
    const defaultConfig = {
        normalization: {type:"multi",val:"sigmoid",options:["none","sigmoid","minMaxScaler"],comment:"Method to normalize result scores"},
        combination_method:{type:"multi",val:"sum",options:["sum","avg","max"],comment:"Method to use to combine scores"},
        vector_weight : {type:"range",val:1,range:[0,20],step:1,comment:"Weight the vector results"},
        fts_weight : {type:"range",val:1,range:[0,20],step:1,comment:"Weight the text results"}, 
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
            <SetParams loading={loading} config={config} resetConfig={resetConfig} setConfig={setConfig} heading="Relative Score Fusion Params"/>
            <Results queryText={query} response={response} msg={"numCandidates: "+(config.numCandidates.val)} hybrid={true} noResultsMsg={"No Results. Select 'Vector Search' to run a vector query."}/>
        </div>
    )
}

export default RSF;

async function search(query,queryVector,schema,config) {
    var combination = {};
    // Build the combination object based on the selected method
    if(config.combination_method.val === "avg"){
        combination.method = "avg";
        combination.weights = {
            vectorPipeline: config.vector_weight.val,
            fullTextPipeline: config.fts_weight.val
        }
    }else{
        combination.method = "expression";
        if(config.combination_method.val === "sum"){
            combination.expression = {
                $sum:[
                    {$multiply:["$$vectorPipeline",config.vector_weight.val]},
                    {$multiply:["$$fullTextPipeline",config.fts_weight.val]}
                ]
            }
        }else if(config.combination_method.val === "max"){
            combination.expression = {
                $max:[
                    {$multiply:["$$vectorPipeline",config.vector_weight.val]},
                    {$multiply:["$$fullTextPipeline",config.fts_weight.val]}
                ]
            }
        }

    }

    const pipeline = [
        {
            $scoreFusion:{
                input:{
                    pipelines:{
                        vectorPipeline:[
                            {
                                $vectorSearch:{
                                    index: '',
                                    queryVector: queryVector,
                                    path:`${schema.vectorField}`,
                                    numCandidates: config.numCandidates.val,
                                    limit: config.limit.val,
                                }
                            }
                        ],
                        fullTextPipeline:[
                            searchStage(query,schema),
                            {$limit: config.limit.val}
                        ]
                    },
                    normalization: config.normalization.val,
                },
                combination:combination,
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
                pipeline : pipeline
            },
        ).then(response => {response.data.config = config;resolve(response)})
        .catch((error) => {
            reject(error.response.data.error);
        })
    });
}