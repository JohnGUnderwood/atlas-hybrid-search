// Relative Score Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"


function RSF({query,queryVector,schema}){

    const [results, setResults] = useState(null);

    useEffect(() => {
        if(queryVector){
            search(query,queryVector,schema)
            .then(resp => setResults(resp.data.results))
            .catch(error => console.log(error));
        }
    
    },[queryVector]);

    return (
        <Results results={results}/>
    )
}

export default RSF;

async function search(query,queryVector,schema) {
    // CONFIGURATION PARAMETERS
    const vector_scalar = 0.9 // Vector search score scaling factor
    const vector_normalization = 40 // Rough scaling of dot product vector scores
    const fts_scalar = 1 - vector_scalar // FTS score scaling factor
    const fts_normalization = 10 // Rough scaling of full text search scores

    const k = 10
    const overrequest_factor = 10

    const pipeline = [
        {
            $vectorSearch:{
                index: "vectorIndex",
                queryVector: queryVector,
                path:`${schema.vectorField}`,
                numCandidates: k * overrequest_factor,
                limit: k * 2
            }
        },
        {$addFields: {"vs_score": {$meta: "vectorSearchScore"}}},
        {
            $project:{
                title:`$${schema.titleField}`,
                image:`$${schema.imageField}`,
                description:`$${schema.descriptionField}`,
                vs_score:{$multiply: ["$vs_score", vector_scalar / vector_normalization]},
            }
        },
        {
            $unionWith: {
                "coll": "embedded_movies",
                "pipeline": [
                    {
                        $search: {
                            index: "searchIndex",
                            text: {query: query, path: {wildcard:"*"}},
                        }
                    },
                    {$limit: k * 2},
                    {$addFields: {fts_score: {$meta: "searchScore"}}},
                    {
                        $project: {
                            fts_score: {$multiply: ["$fts_score", fts_scalar / fts_normalization]},
                            title:`$${schema.titleField}`,
                            image:`$${schema.imageField}`,
                            description:`$${schema.descriptionField}`
                        }
                    },
                ],
            }
        },
        {
            $group: {
                _id: "$_id",
                vs_score: {$max: "$vs_score"},
                fts_score: {$max: "$fts_score"},
                title:{$first:"$title"},
                image:{$first:"$image"},
                description:{$first:"description"}
            }
        },
        {
            $project: {
                _id: 1,
                title:1,
                image:1,
                description:1,
                vs_score: {$ifNull: ["$vs_score", 0]},
                fts_score: {$ifNull: ["$fts_score", 0]},
            }
        },
        {
            "$project": {
                _id: 1,
                title:1,
                image:1,
                score: {$add: ["$fts_score", "$vs_score"]},
                vs_score: 1,
                fts_score: 1,
            }
        },
        {$limit: k},
        {$sort: {"score": -1}},
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