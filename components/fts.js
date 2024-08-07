// Relative Score Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import { useToast } from '@leafygreen-ui/toast';
import searchStage from "./searchStage";

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
        <Results response={response} noResultsMsg="No results. Type something in the search box."/>
    )
}

export default FTS;

async function search(query,schema) {
    // CONFIGURATION PARAMETERS
    const k = 10

    const pipeline = [
        // {
        //     $search: {
        //         index: '',
        //         text: {query: query, 
        //             path: [
        //             `${schema.titleField}`,
        //             `${schema.descriptionField}`,
        //             ...schema.searchFields,
        //             ...schema.searchFields.map(f => ({'value':`${f}`,'multi':'keywordAnalyzer'}))
        //             ]
        //         },
        //     }
        // },
        searchStage(query,schema),
        {
            $project: {
                score: {$meta: "searchScore"},
                title:`$${schema.titleField}`,
                image:`$${schema.imageField}`,
                description:`$${schema.descriptionField}`,
                ...schema.searchFields.reduce((acc, f) => ({...acc, [f]: `$${f}`}), {})
            }            
        },
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