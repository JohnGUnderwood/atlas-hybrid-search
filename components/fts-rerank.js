// Relative Score Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import { useToast } from '@leafygreen-ui/toast';
import { Spinner } from "@leafygreen-ui/loading-indicator";

function RERANK({query,queryVector,schema}){
    const { pushToast } = useToast();
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(queryVector){
            setLoading(true);
            search(query,queryVector,schema)
            .then(resp => {
              setResponse(resp.data);
              setLoading(false);
            })
            .catch(error => {
              pushToast({timeout:10000,variant:"warning",title:"API Failure",description:`Search query failed. ${error}`});
              console.log(error);
            });
        }
    
    },[queryVector]);

    return (
        <>
        {loading?<Spinner description="Loading..."/>
        :<Results response={response} noResultsMsg="No results. Select 'Vector Search' to vectorise query for re-rank."/>
        }
        </>
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

async function search(query,queryVector,schema) {
    // CONFIGURATION PARAMETERS
    const k = 10
    const queryVectorDotProduct = dotProduct(queryVector,queryVector);

    const pipeline = [
        {
            $search: {
                index: '',
                text: {query: query, path: [`${schema.titleField}`,`${schema.descriptionField}`]},
            }
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
        {$limit: k}
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