// Relative Score Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"

function FTS({query,schema}){

    const [results, setResults] = useState(null);

    useEffect(() => {
        if(query){
            search(query,schema)
            .then(resp => setResults(resp.data.results))
            .catch(error => console.log(error));
        }
    
    },[query]);

    return (
        <Results results={results}/>
    )
}

export default FTS;

async function search(query,schema) {
    // CONFIGURATION PARAMETERS
    const k = 10

    const pipeline = [
        {
            $search: {
                index: '',
                text: {query: query, path: [`${schema.titleField}`,`${schema.descriptionField}`]},
            }
        },
        {
            $project: {
                score: {$meta: "searchScore"},
                title:`$${schema.titleField}`,
                image:`$${schema.imageField}`,
                description:`$${schema.descriptionField}`
            }
        },
        {$limit: k}
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