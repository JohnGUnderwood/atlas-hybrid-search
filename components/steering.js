// Steering Vectors with Feedback
import { useState, useEffect } from "react";
import axios from "axios";

// LeafyGreen
import { Chip } from "@leafygreen-ui/chip";
import { useToast } from '@leafygreen-ui/toast';
import Icon from '@leafygreen-ui/icon';
import TextInput from '@leafygreen-ui/text-input';

// App Components
import Results from "./results"
import SetParams from "./set-params";
import {useApp} from "../context/AppContext";
import { lcpFusion, centroidFusion } from "../lib/earlyFusion";
import {vectorSearchStage} from "../lib/pipelineStages";
import LoadingIndicator from "./LoadingIndicator";
import FilterFields from "./filter-fields";
import styles from "./shared.module.css";

function Steering({query,queryVector}){
    const { pushToast } = useToast();
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const {schema} = useApp();
    // CONFIGURATION PARAMETERS
    const defaultConfig = {
        params:{
            limit : {type:"range",val:10,range:[1,25],step:1,comment:"Number of results to return"},
            numCandidates : {type:"range",val:100,range:[1,625],step:1,comment:"How many candidates to retrieve from the vector search"},
            positiveWeight : {type:"range",val:1.0,range:[0.1,1.0],step:0.1,comment:"Weighting for positive feedback"},
            negativeWeight : {type:"range",val:1.0,range:[0.1,1.0],step:0.1,comment:"Weighting for negative feedback"},
            fusionMethod : {type:"multi",val:"score (late)",options:["score (late)","centroid (early)","lcp (early)"],comment:"Fusion method to use"}
        },
        filters:{}
    }
    const [config, setConfig] = useState(defaultConfig)
    const resetConfig = () => {
        setConfig(defaultConfig);
    }

    const [feedback, setFeedback] = useState({positive:[],negative:[]});
    const [steeringText, setSteeringText] = useState("");

    const addTextFeedback = async (type) => {
        const text = steeringText.trim();
        if(!text) return;
        try{
            const { data } = await axios.get('api/embed', { params: { terms: text, cache: false } });
            setFeedback(prev => ({
                ...prev,
                [type]: [...prev[type], { id: `text_${Date.now()}_${Math.random().toString(36).slice(2,8)}`, label: text, embedding: data }]
            }));
            setSteeringText("");
        }catch(error){
            pushToast({timeout:10000,variant:"warning",title:"Embedding Failure",description:`Steering text embedding failed. ${error}`});
        }
    }


    const VoteList = () => {
        return (
            <>
                {feedback.positive.length > 0 ? <><br/></> : null}
                {feedback.positive.map(vote => (<Chip baseFontSize="16" label={`${vote.label}`} variant="green" key={vote.id} style={{ marginRight: "4px" }} onDismiss={() => setFeedback(prev => ({...prev, positive: prev.positive.filter(_v => _v.id !== vote.id)}))}/>))}
                {feedback.positive.length > 0 && feedback.negative.length > 0 ? <><br/><br/></> : null}
                {feedback.negative.map(vote => (<Chip baseFontSize="16" label={`${vote.label}`} variant="red" key={vote.id} style={{ marginRight: "4px" }} onDismiss={() => setFeedback(prev => ({...prev, negative: prev.negative.filter(_v => _v.id !== vote.id)}))}/>))}
            </>
        );
    }

    const handleSearch = () => {
        setLoading(true);
        search(query,queryVector,schema,config,feedback)
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
                <SetParams loading={loading} config={Object.fromEntries(Object.entries(config.params).filter(([k,v]) => !['positiveWeight','negativeWeight','fusionMethod'].includes(k)))} resetConfig={resetConfig} setConfig={setConfig} heading="Vector Search Params"/>
                <FilterFields query={query} schema={schema} config={config} setConfig={setConfig} />
                <h2>Steering Feedback</h2>
                <div className={styles.steeringRow}>
                    <TextInput
                        className={styles.steeringLgInput}
                        aria-label="Steering feedback text"
                        value={steeringText}
                        onChange={(e) => setSteeringText(e.target.value)}
                        placeholder="Add free-text steering"
                        sizeVariant="small"
                    />
                    <div className={styles.steeringIcons}>
                        <Icon glyph="ThumbsUp" role="button" title="Add positive steering text" style={{cursor:"pointer",color:"#00684A"}} onClick={() => addTextFeedback('positive')} />
                        <Icon glyph="ThumbsDown" role="button" title="Add negative steering text" style={{cursor:"pointer",color:"#B45A3C"}} onClick={() => addTextFeedback('negative')} />
                    </div>
                </div>
                
                {feedback.positive.length > 0 || feedback.negative.length > 0 ? 
                    <>
                        <VoteList feedback={feedback} setFeedback={setFeedback} />
                        <br/>
                        <SetParams loading={loading} config={Object.fromEntries(Object.entries(config.params).filter(([k,v]) => ['positiveWeight','negativeWeight','fusionMethod'].includes(k)))} setConfig={setConfig} heading=""/>
                    </>
                    : <></>
                }
                
            </div>
            {loading
                ?<LoadingIndicator description="Loading..."/>
                :<Results feedback={feedback} setFeedback={setFeedback} queryText={query} response={response} msg={"numCandidates: "+(config.params.numCandidates.val)} noResultsMsg={"No Results. Select 'Vector Search' to run a vector query."}/>
            }
        </div>
    )
}

export default Steering;

async function getSteeringVectors(feedback,schema){
    const positiveTextVectors = feedback.positive.filter(f => f.embedding).map(f => ({ _id: f.id, embedding: f.embedding }));
    const negativeTextVectors = feedback.negative.filter(f => f.embedding).map(f => ({ _id: f.id, embedding: f.embedding }));
    const positiveIds = feedback.positive.filter(f => !f.embedding).map(f => f.id);
    const negativeIds = feedback.negative.filter(f => !f.embedding).map(f => f.id);
    const positiveVectors = positiveIds.length > 0? await axios.post(`api/get`,{ids: positiveIds,projection:{embedding:`$${schema.vectorField}`}}) : {data:[]};
    const negativeVectors = negativeIds.length > 0? await axios.post(`api/get`,{ids: negativeIds,projection:{embedding:`$${schema.vectorField}`}}) : {data:[]};

    return {
        positive: [...positiveVectors.data, ...positiveTextVectors],
        negative: [...negativeVectors.data, ...negativeTextVectors]
    }
}

async function search(query,queryVector,schema,config,feedback) {
    let pipeline = [];
    if(!config.params.fusionMethod.val || (feedback.positive.length == 0 && feedback.negative.length == 0)){
        // If there's no feedback default to standard vector search
        pipeline.push(
            vectorSearchStage(
                queryVector,
                schema,
                config,
                query
        ));
    }else{
        const steering = await getSteeringVectors(feedback,schema);
        if(config.params.fusionMethod.val == "score (late)"){
            // For late score fusion we build a single $scoreFusion stage with multiple pipelines   
            pipeline.push(
                {
                    $scoreFusion:{
                        input:{
                            pipelines:{
                                query: [vectorSearchStage(
                                    queryVector,
                                    schema,
                                    config,
                                    query
                                )]
                            },
                            normalization: "none",
                        },
                        combination: {
                            method:"expression",
                            expression: {
                                $add: [
                                    "$$query", 1,
                                    ...steering.positive.map(_v => ({$multiply: [`$$positive_${_v._id}`, config.params.positiveWeight.val]})),
                                    ...steering.negative.map(_v => ({$multiply: [`$$negative_${_v._id}`, -config.params.negativeWeight.val]}))
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
                        $search: {
                            index: '',
                            vectorSearch: {
                                path: `${schema.vectorField}`,
                                queryVector: v.embedding,
                                numCandidates: config.params.numCandidates.val,
                                limit: config.params.limit.val
                            }
                        }
                    }
                ]
            }
            for(const v of steering.negative){
                pipeline[0].$scoreFusion.input.pipelines[`negative_${v._id}`] = [
                    {
                        $search: {
                            index: '',
                            vectorSearch: {
                                path: `${schema.vectorField}`,
                                queryVector: v.embedding,
                                numCandidates: config.params.numCandidates.val,
                                limit: config.params.limit.val
                            }
                        }
                    }
                ]
            }
            pipeline.push({$addFields:{scoreDetails: {$meta:"scoreDetails"}}});
        }else{
            // For early fusion we modify the query vector itself
            let fusedVector;
            if(config.params.fusionMethod.val == "lcp (early)"){
                // Using Linear Combination with Projection
                fusedVector = lcpFusion(queryVector, steering.positive.map(v => v.embedding), steering.negative.map(v => v.embedding), config.params.positiveWeight.val, config.params.negativeWeight.val);
            }
            else if(config.params.fusionMethod.val == "centroid (early)"){
                // Using Centroid geometry
                fusedVector = centroidFusion(queryVector, steering.positive.map(v => v.embedding), steering.negative.map(v => v.embedding), config.params.positiveWeight.val, config.params.negativeWeight.val);
            }
            pipeline.push(
                vectorSearchStage(
                    fusedVector,
                    schema,
                    config
                )
            );
        }
    };
    pipeline.push(
        {
            $project: {
                score: {$ifNull:["$scoreDetails.value",{$meta:"searchScore"}]},
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