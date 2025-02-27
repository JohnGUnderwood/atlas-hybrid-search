// Relative Score Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import { useToast } from '@leafygreen-ui/toast';
import searchStage from "./searchStage";
import projectStage from "./projectStage";

function FTS({query,schema}){
    const { pushToast } = useToast();
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(query){
            setLoading(true);
            search(query,schema)
            .then(resp => {
                setResponse(resp.data);
                setLoading(false);
            })
            .catch(error => {
                console.log(error);
                pushToast({timeout:10000,variant:"warning",title:"API Failure",description:`Search query failed. ${error}`})
            });
        }
    
    },[query]);

    return (
        <Results queryText={query} schema={schema} response={response} noResultsMsg={`No results. ${query == '' || !query ? 'Type something in the search box.' : ''}`}/>
    )
}

export default FTS;

async function search(query,schema) {
    // CONFIGURATION PARAMETERS
    const k = 10

    const pipeline = [
        searchStage(query,schema),
        projectStage(schema),
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