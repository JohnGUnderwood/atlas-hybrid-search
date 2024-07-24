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

function Results({response,msg,hybrid,noResultsMsg}){
    const [open, setOpen] = useState(false);
    const results = response? response.results.length > 0? response.results : null : null;
    const query = response? response.query : null;
    const time = response? response.time : null;

    return (
        <div>
        {
        results ?
            <div style={{paddingLeft:"40px",paddingRight:"40px"}}>
                <div style={{paddingTop:"25px"}}>
                    <div style={{display:"grid",gridTemplateColumns:"50% 50%",gap:"5px",alignItems:"start"}}>
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
                                                {r.description}
                                            </Description>
                                            {Object.keys(r).filter(k => !["_id","score","title","image","description"].includes(k)).map(k => (
                                                Array.isArray(r[k])
                                                ? (<p key={`${r._id}${k}`}>{k} : <span style={{fontWeight:"normal"}}>{r[k].join(", ")}</span></p>)
                                                : (<p key={`${r._id}${k}`}>{k} : <span style={{fontWeight:"normal"}}>{r[k]}</span></p>)
                                                
                                            ))}
                                            {hybrid ?
                                                <HybridScore result={r} key={`${r._id}scores`}/>
                                            :<></>
                                            }
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
                    <Code language={'javascript'}>
                        {query ? JSON.stringify(query,null,2) : "" }
                    </Code>
                </Modal>
            </div>
        :
            <div style={{padding:"16px 16px"}}><Banner variant="warning">{noResultsMsg}</Banner></div>
        }</div>
    )
}

export default Results;