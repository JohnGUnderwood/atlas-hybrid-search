// Relative Score Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import { useToast } from '@leafygreen-ui/toast';
import { Spinner } from "@leafygreen-ui/loading-indicator";
import SetParams from "./set-params";


function RERANK({query,queryVector,schema}){
    const { pushToast } = useToast();
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);

    // CONFIGURATION PARAMETERS
    const defaultConfig = {
        k : {val:10,range:[1,25],step:1,comment:"Number of results to show"},
        r : {val:100,range:[10,250],step:10,comment:"Number of results to fetch for reranking"}
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
            <SetParams loading={loading} config={config} resetConfig={resetConfig} handleSliderChange={handleSliderChange} heading="Reranking Params"/>
            {loading
                ?<Spinner description="Loading..."/>
                :<Results response={response} noResultsMsg={"No Results. Select 'Vector Search' to run a vector query."}/>
            }
        </div>
    )
}

export default RERANK;

function dotProduct(vector1,vector2){
    var result = 0;
    for (var i=0;i<vector1.length;i++){
        result += vector1[i]*vector2[i]
    }
    return result;
}

async function search(query,queryVector,schema,config) {
    // CONFIGURATION PARAMETERS
    const queryVectorDotProduct = dotProduct(queryVector,queryVector);

    const pipeline = [
        {
            $search: {
                index: '',
                text: {query: query, path: [`${schema.titleField}`,`${schema.descriptionField}`]},
            }
        },
        {
            $limit: config.r.val
        },
        {
            $project:{
                vector: `$${schema.vectorField}`,
                score: {$meta: "searchScore"},
                title:`$${schema.titleField}`,
                image:`$${schema.imageField}`,
                description:`$${schema.descriptionField}`
            }
        },
        {
            $addFields:{
                // Cosine similarity of (A,B) is dotproduct(A,B)/magnitude(A)*magnitude(B)
                // magnitude(A)*magnitude(B) is the same as sqrt(dotproduct(A,A)*dotproduct(B,B))
                // Input vectors must have the same size (dimension)
                cosinesim:{
                    $cond:{
                        if:{ $ne : [{ $type: '$vector' }, 'missing'] },
                        then:{
                            $divide:[
                                //dot product of pair of vector with queryVector
                                {
                                    $reduce:{
                                        input:{
                                            // Create array of product of vector pair elements
                                            $map:{
                                                input:{$range: [0, {$size:"$vector"}]},
                                                as: "index",
                                                in: {
                                                    //Calculate dot product of each pair of elements in two vectors
                                                    $multiply:[
                                                        {$arrayElemAt:["$vector","$$index"]},
                                                        {$arrayElemAt:[queryVector,"$$index"]}
                                                    ]
                                                }
                                            }
                                        },
                                        initialValue:0.0,
                                        // Sum up products to get dot product of vector pair
                                        in:{
                                            $add:["$$value","$$this"]
                                        }
                                    }
                                },
                                //product of magnitudes of vectors
                                {
                                    $sqrt:{
                                        $multiply:[
                                            // dot product of vector with itself
                                            {
                                                $reduce:{
                                                    input:{
                                                        // Create array of product of vector pair elements
                                                        $map:{
                                                            input:{$range: [0, {$size:"$vector"}]},
                                                            as: "index",
                                                            in: {
                                                                //Calculate dot product of each pair of elements in two vectors
                                                                $multiply:[
                                                                    {$arrayElemAt:["$vector","$$index"]},
                                                                    {$arrayElemAt:["$vector","$$index"]}
                                                                ]
                                                            }
                                                        }
                                                    },
                                                    initialValue:0.0,
                                                    // Sum up products to get dot product of vector pair
                                                    in:{
                                                        $add:["$$value","$$this"]
                                                    }
                                                }
                                            },
                                            // dot product of query vector with itself
                                            queryVectorDotProduct
                                        ]
                                    }
                                }
                            ]
                        },
                        else:0
                    }
                }
            }
        },
        {$sort:{cosinesim:-1}},
        {$limit: config.k.val}
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