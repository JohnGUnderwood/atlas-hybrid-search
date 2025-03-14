// Relative Score Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import { useToast } from '@leafygreen-ui/toast';

function FTS({query}){
    const { pushToast } = useToast();
    const [response, setResponse] = useState(null);

    useEffect(() => {
        if(query){
            search(query)
            .then(resp => {
                setResponse(resp.data);
            })
            .catch(error => {
                console.log(error);
                pushToast({timeout:10000,variant:"warning",title:"API Failure",description:`Search query failed. ${error}`})
            });
        }
    
    },[query]);

    return (
        <Results queryText={query} response={response} noResultsMsg={`No results. ${query == '' || !query ? 'Type something in the search box.' : ''}`}/>
    )
}

export default FTS;

async function search(query) {
    return new Promise((resolve,reject) => {
        axios.post(`api/search/fts`,
            { 
                query: query,
                config : {k:10}
            },
        ).then(response => resolve(response))
        .catch((error) => {
            reject(error.response.data.error);
        })
    });
}