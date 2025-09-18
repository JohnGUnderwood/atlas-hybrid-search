import { useState } from "react";
import {SearchResult} from '@leafygreen-ui/search-input';
import { Body, Subtitle, Description, } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import HybridScore from "./hybrid-score";
import { palette } from '@leafygreen-ui/palette';
import Button from '@leafygreen-ui/button';
import Modal from '@leafygreen-ui/modal';
import Code from '@leafygreen-ui/code';
import Banner from '@leafygreen-ui/banner'
import createHighlighting from "../lib/highlighting";
import Checkbox from '@leafygreen-ui/checkbox';
import { useEffect } from "react";
import { useToast } from '@leafygreen-ui/toast';
import { useApp } from '../context/AppContext';
import axios from "axios";

const Bulb = () => <svg style={{width:"16px",flexShrink:0}} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" role="img" aria-label="Bulb Icon"><path fill="currentColor" d="M12.331 8.5a5 5 0 1 0-8.612.086L5.408 11.5a1 1 0 0 0 .866.499H6.5V6a1.5 1.5 0 1 1 3 0v6h.224a1 1 0 0 0 .863-.496L12.34 8.5h-.009Z"></path><path fill="currentColor" d="M7.5 6v6h1V6a.5.5 0 0 0-1 0ZM10 14v-1H6v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1Z"></path></svg>;

function filterQueryVectors(obj) {
    if (Array.isArray(obj)) {
        return obj.map(filterQueryVectors);
    } else if (obj && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => 
                k === 'queryVector' && Array.isArray(v)
                    ? [k, `[Array of length ${v.length}]`]
                    : [k, filterQueryVectors(v)]
            )
        );
    }
    return obj;
}

function Results({queryText,response,msg,hybrid,noResultsMsg,rerankOpt=true}){
    const [open, setOpen] = useState(false);
    const query = response? response.query : null;
    const time = response? response.time : null;
    const {model,schema} = useApp();
    const [rerank, setRerank] = useState(false);
    const [results, setResults] = useState(response? response.results.length > 0? response.results : null : null);
    const [rerankedResults, setRerankedResults] = useState(null);
    const { pushToast } = useToast();

    useEffect(() => {
        if(rerank && rerankedResults == null && response.results.length >0 && queryText && queryText != "")
        {
            axios.post('api/rerank', {documents:response.results,query:queryText})
                .then(resp => {
                    setResults(resp.data.results);
                    setRerankedResults(resp.data.results);
                })
                .catch(error => {
                    console.log(error);
                    pushToast({timeout:10000,variant:"warning",title:"API Failure",description:`Reranking failed. ${error}`});
                });
        }
        // Want to 'cache' reranked results so not always hitting API unless response has changed.
        else if(rerank && rerankedResults){
            setResults(rerankedResults);
        }
        else if(!rerank && response?.results.length > 0)    
        {
            setResults(response.results);
        }
    },[rerank]);

    useEffect(() => {
        if(response && response.results.length > 0)
        {
            setResults(response.results);
            setRerankedResults(null);
            setRerank(false);
        }
    },[response]);



    return (
        <div>
        {
        results ?
            <div style={{paddingLeft:"40px",paddingRight:"40px"}}>
                <div style={{paddingTop:"25px"}}>
                    <div style={{display:"grid",gridTemplateColumns:"20% 50% 30%",gap:"5px",alignItems:"start"}}>
                        {(model?.reranking?.provider && rerankOpt)? <div style={{padding:"4px 16px"}}><Checkbox checked={rerank} bold={true} label={"Use Reranker"} onChange={event => setRerank(!rerank)}/></div> : <></>}
                        <div style={{padding:"4px 16px"}}><span style={{borderRadius:"5px",backgroundColor:palette.blue.light3, padding:"2px 4px", float:"left"}}><em>{msg? `${msg}, query took ${time}ms`:`query took ${time}ms`}</em></span></div>
                        <div style={{padding:"4px 16px"}}><Button style={{float:"right"}} onClick={()=>setOpen(true)} variant="default">Show Query</Button></div>
                    </div>
                    {
                    results && results.length > 0
                    ?
                    <div>
                        {results.map(r => (
                            <SearchResult key={r._id}>
                                <Card>
                                    <Subtitle key={`${r._id}title`} style={{paddingBottom:"5px"}}>
                                    {r.title}
                                    </Subtitle>
                                    <div style={{display:"grid",gridTemplateColumns:"60px 90%",gap:"5px",alignItems:"start"}}>
                                        <img src={r.image} style={{maxHeight:"75px",maxWidth:"60px"}}/>
                                        <div>
                                            <Description key={`${r._id}desc`}>
                                                {r.highlights?.length > 0
                                                    ?
                                                    <span dangerouslySetInnerHTML={createHighlighting(r.highlights,`${schema.descriptionField}`,r.description)} />
                                                    : 
                                                    r.description
                                                }
                                            </Description>
                                            {Object.keys(r).filter(k => !["_id","fts_score","vs_score","score","title","image","description","boost","highlights","vectorScore","rerank_score","reranked","scoreDetails"].includes(k)).map(k => (
                                                Array.isArray(r[k])
                                                ? (<p key={`${r._id}${k}`}>{k} : <span style={{fontWeight:"normal"}}>{r[k].join(", ")}</span></p>)
                                                : (<p key={`${r._id}${k}`}>{k} : <span style={{fontWeight:"normal"}}>{r[k]}</span></p>)
                                                
                                            ))}
                                            {hybrid ?
                                                <HybridScore result={r}
                                                    method={response.config?.combination_method.val}
                                                    weights={{
                                                        vector: response.config?.vector_weight.val,
                                                        fts: response.config?.fts_weight.val
                                                    }}
                                                    key={`${r._id}scores`}/>
                                            :<p key={`${r._id}score`}>score : <span style={{fontWeight:"normal"}}>{r.score}</span></p>
                                            }
                                            {r.boost? <Banner style={{margin:"10px"}} variant="warning" image={<Bulb/>}>Semantically Boosted Result</Banner> : <></>}
                                            {r.reranked? <Banner style={{margin:"10px"}} variant="info">{`${r.reranked}`.toUpperCase()} (score: {r.rerank_score})</Banner> : <></>}
                                        </div>
                                    </div>
                                </Card>
                            </SearchResult>
                        ))}
                    </div>
                    :
                    <></>
                    }
                </div>
                <Modal open={open} setOpen={setOpen}>
                    <Subtitle>MongoDB Aggregation Pipeline</Subtitle>
                    <p>(press 'ESC' to close)</p>
                    <Code language={'javascript'}>
                        {query ? JSON.stringify(filterQueryVectors(query),null,2) : "" }
                    </Code>
                </Modal>
            </div>
        :
            <div style={{padding:"16px 16px"}}><Banner variant="warning">{noResultsMsg}</Banner></div>
        }</div>
    )
}

export default Results;