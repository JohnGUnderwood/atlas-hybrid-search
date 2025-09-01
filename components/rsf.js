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
    combination = {
        weights:{
            vectorPipeline: config.vector_weight.val,
            fullTextPipeline: config.fts_weight.val
        }
    }

    if(config.combination_method.val === "avg"){
        combination.method = "avg";
    }else{
        combination.method = "expression";
        if(config.combination_expression.val === "sum"){
            combination.expression = {
                $sum:["$$vectorPipeline","$$fullTextPipeline"]
            }
        }else if(config.combination_expression.val === "max"){
            combination.expression = {
                $max:["$$vectorPipeline","$$fullTextPipeline"]
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
        }
    ]

    // const pipeline = [
    //     ,
    //     {$addFields: {"vs_score": {$meta: "vectorSearchScore"}}},
    //     {
    //         $project:{
    //             title:`$${schema.titleField}`,
    //             image:`$${schema.imageField}`,
    //             description:`$${schema.descriptionField}`,
    //             ...schema.searchFields.reduce((acc, f) => ({...acc, [f]: `$${f}`}), {}),
    //             vs_score: {$multiply:[config.vector_scalar.val,{$divide: [1,{$sum:[1,{$exp:{$multiply:[-1,"$vs_score"]}}]}]}]},//Sigmoid function: 1/(1+exp(-x))
    //         }
    //     },
    //     {
    //         $unionWith: {
    //             coll: '',
    //             pipeline: [
    //                 searchStage(query,schema),
    //                 {$limit: Math.min(config.limit.val * 2, config.numCandidates.val)},
    //                 {$addFields: {fts_score: {$meta: "searchScore"}}},
    //                 {
    //                     $project: {
    //                         fts_score: {$multiply:[config.fts_scalar.val,{$divide: [1,{$sum:[1,{$exp:{$multiply:[-1,"$fts_score"]}}]}]}]},//Using sigmoid function: 1/(1+exp(-x))
    //                         title:`$${schema.titleField}`,
    //                         image:`$${schema.imageField}`,
    //                         description:`$${schema.descriptionField}`,
    //                         ...schema.searchFields.reduce((acc, f) => ({...acc, [f]: `$${f}`}), {})
    //                     }
    //                 },
    //             ],
    //         }
    //     },
    //     {
    //         $group: {
    //             _id: "$_id",
    //             vs_score: {$max: "$vs_score"},
    //             fts_score: {$max: "$fts_score"},
    //             title:{$first:"$title"},
    //             image:{$first:"$image"},
    //             description:{$first:"$description"},
    //             ...schema.searchFields.reduce((acc, f) => ({...acc, [f]: {$first:`$${f}`}}), {})
    //         }
    //     },
    //     {
    //         $project: {
    //             _id: 1,
    //             title:1,
    //             image:1,
    //             description:1,
    //             vs_score: {$ifNull: ["$vs_score", 0]},
    //             fts_score: {$ifNull: ["$fts_score", 0]},
    //             ...schema.searchFields.reduce((acc, f) => ({...acc, [f]: `$${f}`}), {})
    //         }
    //     },
    //     {
    //         $addFields:{
    //             score: {
    //                 $add: ["$fts_score", "$vs_score"],
    //             },
    //         }
    //     },
    //     {$sort: {"score": -1}},
    //     {$limit: config.limit.val}
    // ]
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