// Relative Score Fusion
import { useState, useEffect } from "react";
import axios from "axios";

// LeafyGreen
import { Chip } from "@leafygreen-ui/chip";
import { useToast } from '@leafygreen-ui/toast';
import Button from '@leafygreen-ui/button';

// App Components
import Results from "./results"
import SetParams from "./set-params";
import {useApp} from "../context/AppContext";
import { lcpFusion, centroidFusion } from "../lib/earlyFusion";

function Steering({query,queryVector}){
    const { pushToast } = useToast();
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const {schema} = useApp();
    // CONFIGURATION PARAMETERS
    const defaultConfig = {
        limit : {type:"range",val:10,range:[1,25],step:1,comment:"Number of results to return"},
        numCandidates : {type:"range",val:100,range:[1,625],step:1,comment:"How many candidates to retrieve from the vector search"},
        positiveWeight : {type:"range",val:1.0,range:[0.1,1.0],step:0.1,comment:"Weighting for positive feedback"},
        negativeWeight : {type:"range",val:1.0,range:[0.1,1.0],step:0.1,comment:"Weighting for negative feedback"},
        fusionMethod : {type:"multi",val:"score (late)",options:["score (late)","centroid (early)","lcp (early)"],comment:"Fusion method to use"}
    }
    const [config, setConfig] = useState(defaultConfig)
    const resetConfig = () => {
        setConfig(defaultConfig);
    }

    const [feedback, setFeedback] = useState({positive:[],negative:[]});


    const VoteList = () => {
        return (
            <>
                {feedback.positive.map(vote => (<Chip label={`${vote.label}`} variant="green" key={vote.id} style={{ marginRight: "4px" }} onDismiss={() => setFeedback({...feedback, positive: feedback.positive.filter(_v => _v.id !== vote.id)})}/>))}
                {feedback.positive.length > 0 && feedback.negative.length > 0 ? <><br/><br/></> : null}
                {feedback.negative.map(vote => (<Chip label={`${vote.label}`} variant="red" key={vote.id} style={{ marginRight: "4px" }} onDismiss={() => setFeedback({...feedback, negative: feedback.negative.filter(_v => _v.id !== vote.id)})}/>))}
            </>
        );
    }

    const handleSearch = () => {
        setLoading(true);
        search(queryVector,schema,config,feedback)
        .then(resp => {
          setResponse(resp.data);
          setLoading(false);
        })
        .catch(error => {
          pushToast({timeout:10000,variant:"warning",title:"API Failure",description:`Search query failed. ${error}`});
          console.log(error);
        });
    }

    useEffect(() => {
        if(queryVector){
            handleSearch();
        }else{
          setResponse(prev => {
            return {
              ...prev,
              results: []
            };
          });
        }
    
    },[queryVector,config,feedback.positive,feedback.negative]);

    return (
        <div style={{display:"grid",gridTemplateColumns:"20% 80%",gap:"5px",alignItems:"start"}}>
            <div>
                <SetParams loading={loading} config={Object.fromEntries(Object.entries(config).filter(([k,v]) => ['limit','numCandidates'].includes(k)))} resetConfig={resetConfig} setConfig={setConfig} heading="Vector Search Params"/>
                <br/>
                {feedback.positive.length > 0 || feedback.negative.length > 0 ? 
                    <>
                        <h2>Steering Feedback</h2>
                        <VoteList feedback={feedback} setFeedback={setFeedback} />
                        <br/>
                        <SetParams loading={loading} config={Object.fromEntries(Object.entries(config).filter(([k,v]) => !['limit','numCandidates'].includes(k)))} setConfig={setConfig} heading=""/>
                    </>
                    : <></>
                }
                
            </div>
            <Results feedback={feedback} setFeedback={setFeedback} queryText={query} response={response} msg={"numCandidates: "+(config.numCandidates.val)} noResultsMsg={"No Results. Select 'Vector Search' to run a vector query."}/>
        </div>
    )
}

export default Steering;

async function getSteeringVectors(feedback,schema){
    const positiveVectors = await axios.post(`api/get`,{ids: feedback.positive.map(f => f.id),projection:{embedding:`$${schema.vectorField}`}});
    const negativeVectors = await axios.post(`api/get`,{ids: feedback.negative.map(f => f.id),projection:{embedding:`$${schema.vectorField}`}});

    return {
        positive: positiveVectors.data,
        negative: negativeVectors.data
    }
}

async function search(queryVector,schema,config,feedback) {
    const steering = await getSteeringVectors(feedback,schema);
    let pipeline = [];
    if(!config.fusionMethod.val || (feedback.positive.length == 0 && feedback.negative.length == 0)){
        // If there's no feedback default to standard vector search
        pipeline.push({$vectorSearch: {
                index: '',
                path: `${schema.vectorField}`,
                queryVector: queryVector,
                numCandidates: config.numCandidates.val,
                limit: config.limit.val
            }
        });
    }else if(config.fusionMethod.val == "score (late)"){
        // For late score fusion we build a single $scoreFusion stage with multiple pipelines   
        pipeline.push(
            {
                $scoreFusion:{
                    input:{
                        pipelines:{
                            query: [{
                                $vectorSearch: {
                                    index: '',
                                    path: `${schema.vectorField}`,
                                    queryVector: queryVector,
                                    numCandidates: config.numCandidates.val,
                                    limit: config.limit.val
                                }
                            }]
                        },
                        normalization: "none",
                    },
                    combination: {
                        method:"expression",
                        expression: {
                            $add: [
                                "$$query", 1,
                                ...steering.positive.map(_v => ({$multiply: [`$$positive_${_v._id}`, config.positiveWeight.val]})),
                                ...steering.negative.map(_v => ({$multiply: [`$$negative_${_v._id}`, -config.negativeWeight.val]}))
                            ]
                        }
                    },
                    scoreDetails:true
                }
                
            },
        )
        for(const v of steering.positive){
            pipeline[0].$scoreFusion.input.pipelines[`positive_${v._id}`] = [
                {
                    $vectorSearch: {
                        index: '',
                        path: `${schema.vectorField}`,
                        queryVector: v.embedding,
                        numCandidates: config.numCandidates.val,
                        limit: config.limit.val
                    }
                }
            ]
        }
        for(const v of steering.negative){
            pipeline[0].$scoreFusion.input.pipelines[`negative_${v._id}`] = [
                {
                    $vectorSearch: {
                        index: '',
                        path: `${schema.vectorField}`,
                        queryVector: v.embedding,
                        numCandidates: config.numCandidates.val,
                        limit: config.limit.val
                    }
                }
            ]
        }
        pipeline.push({$addFields:{scoreDetails: {$meta:"scoreDetails"}}});
    }else{
        // For early fusion we modify the query vector itself
        let fusedVector;
        if(config.fusionMethod.val == "lcp (early)"){
            // Using Linear Combination with Projection
            fusedVector = lcpFusion(queryVector, steering.positive.map(v => v.embedding), steering.negative.map(v => v.embedding), config.positiveWeight.val, config.negativeWeight.val);
        }
        else if(config.fusionMethod.val == "centroid (early)"){
            // Using Centroid geometry
            fusedVector = centroidFusion(queryVector, steering.positive.map(v => v.embedding), steering.negative.map(v => v.embedding), config.positiveWeight.val, config.negativeWeight.val);
        }
        pipeline.push({
            $vectorSearch: {
                index: '',
                path: `${schema.vectorField}`,
                queryVector: fusedVector,
                numCandidates: config.numCandidates.val,
                limit: config.limit.val
            }
        });
    };
    pipeline.push(
        {
            $project: {
                score: {$ifNull:["$scoreDetails.value",{$meta:"vectorSearchScore"}]},
                title:`$${schema.titleField}`,
                image:`$${schema.imageField}`,
                description:`$${schema.descriptionField}`,
                ...schema.searchFields.reduce((acc, f) => ({...acc, [f]: `$${f}`}), {})
            }
        }
    );

    return new Promise((resolve,reject) => {
        axios.post(`api/search`,
            { 
                pipeline : pipeline
            },
        ).then(response => resolve(response))
        .catch((error) => {
            console.log(pipeline);
            reject(error.response.data.error);
        })
    });
}