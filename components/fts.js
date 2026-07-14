// Relative Score Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import SetParams from "./set-params";
import { useToast } from '@leafygreen-ui/toast';
import {searchStage,projectStage, rerankParam, appendRerankStage} from "../lib/pipelineStages";
import {useApp} from "../context/AppContext";
import LoadingIndicator from "./LoadingIndicator";
import FilterFields from "./filter-fields";

function FTS({query}){
    const { pushToast } = useToast();
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const {schema,model} = useApp();

    // CONFIGURATION PARAMETERS
    const defaultConfig = {
        params: {
            ...rerankParam(model)
        },
        filters: {}
    }
    const [config, setConfig] = useState(defaultConfig)
    
    const resetConfig = () => {
        setConfig(defaultConfig);
    }

    useEffect(() => {
        if(query){
            setLoading(true);
            search(query,schema,config,model)
            .then(resp => {
                setResponse(resp.data);
            })
            .catch(error => {
                console.log(error);
                pushToast({timeout:10000,variant:"warning",title:"API Failure",description:`Search query failed. ${error}`})
            }).finally(() => setLoading(false));
        }else{
          setResponse(prev => {
            return {
              ...prev,
              results: []
            };
          });
        }    
    },[query, config]);

    return (
        <div style={{display:"grid",gridTemplateColumns:"20% 80%",gap:"5px",alignItems:"start"}}>
            <div>
                {Object.keys(config.params).length > 0
                    ? <SetParams loading={loading} config={config.params} resetConfig={resetConfig} setConfig={setConfig} heading="Text Search Params"/>
                    : <></>
                }
                <FilterFields query={query} schema={schema} config={config} setConfig={setConfig} label="Filter Text Search" description="Add search filters on metadata"/>
            </div>

            {loading
            ?<LoadingIndicator description="Loading..."/>
            :<Results queryText={query} response={response} noResultsMsg={`No results. ${query == '' || !query ? 'Type something in the search box.' : ''}`}/>
        }
        </div>
        // <>
        // {loading
        //     ?<LoadingIndicator description="Loading..."/>
        //     :<Results queryText={query} response={response} noResultsMsg={`No results. ${query == '' || !query ? 'Type something in the search box.' : ''}`}/>
        // }
        // </>
    )
}

export default FTS;

async function search(query,schema,config,model) {
    // CONFIGURATION PARAMETERS
    const k = 10

    const pipeline = [
        searchStage(query,schema,config),
        projectStage(schema),
        {$limit: k}
    ]
    return new Promise((resolve,reject) => {
        axios.post(`api/search`,
            { 
                pipeline : appendRerankStage(pipeline, {query, schema, model, config})
            },
        ).then(response => resolve(response))
        .catch((error) => {
            reject(error.response.data.error);
        })
    });
}