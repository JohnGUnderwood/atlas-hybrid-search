import axios from 'axios';
import Header from '../components/head';
import RSF from '../components/rsf';
import RRF from '../components/rrf';
import FTS from '../components/fts';
import VS from '../components/vs';
import {SearchInput} from '@leafygreen-ui/search-input';
import { useState, } from 'react';
import Button from '@leafygreen-ui/button';
import { Tabs, Tab } from '@leafygreen-ui/tabs';
import AppBanner from '../components/banner';
import { ToastProvider, useToast } from '@leafygreen-ui/toast';
import { Spinner } from "@leafygreen-ui/loading-indicator";
import schema from '../config.mjs';
import Modal from '@leafygreen-ui/modal';
import { Subtitle } from '@leafygreen-ui/typography';
import Code from '@leafygreen-ui/code';
import ExpandableCard from '@leafygreen-ui/expandable-card';

const Home = () => {
  const { pushToast } = useToast();
  const [query, setQuery] = useState("");
  const [queryVector, setQueryVector] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [indexes, setIndexes] = useState(null);
  const [open, setOpen] = useState(false);

  const handleSearch = () => {
    console.log("Search Clicked!")
    if(query && query != ""){
      setLoading(true);
      embedQuery(query)
      .then(resp => {
        console.log("Query Embedded!")
        setQueryVector(resp);
        setLoading(false);
      })
      .catch(error => {
        console.log(error);
        pushToast({timeout:10000,variant:"warning",title:"API Failure",description:`Failed to encode query using embedding model. ${error}`});
      });
    }
  }

  const handleShowIndexes = () => {
    console.log("Show Indexes Clicked!")
    getIndexes()
    .then(resp => {
      console.log("Indexes Fetched!")
      setIndexes(resp);
      setOpen(true);
    })
    .catch(error => {
      console.log(error);
      pushToast({timeout:10000,variant:"warning",title:"API Failure",description:`Failed to fetch indexes. ${error}`});
    });
  }

  const handleQueryChange = (event) => {setQuery(event.target.value);};

  return (
    <>
    <Header/>
    <AppBanner heading="Atlas Hybrid Search Tester"></AppBanner>
    <div style={{display:"grid",gridTemplateColumns:"85% 120px 120px",gap:"10px",alignItems:"start"}}>
      <div><SearchInput value={query} onChange={handleQueryChange} aria-label="some label" style={{marginBottom:"20px"}}></SearchInput></div>
      <div style={{maxWidth:"120px"}}><Button onClick={()=>handleSearch()} variant="primary">Vector Search</Button></div>
      <div style={{maxWidth:"120px"}}><Button onClick={()=>handleShowIndexes()}>Show Indexes</Button></div>
    </div>
    {loading?<Spinner description="Loading..."/>:<></>}
    <Tabs style={{marginTop:"15px"}} setSelected={setSelectedTab} selected={selectedTab}>
      <Tab name="Fulltext Search">
        <FTS query={query} schema={schema}/>
      </Tab>
      <Tab name="Vector Search">
        <VS queryVector={queryVector} schema={schema}/>
      </Tab>
      <Tab name="Relative Score Fusion">
        <RSF query={query} queryVector={queryVector} schema={schema}/>
      </Tab>
      <Tab name="Reciprocal Rank Fusion">
        <RRF query={query} queryVector={queryVector} schema={schema}/>
      </Tab>
    </Tabs>
    <Modal open={open} setOpen={setOpen}>
      <ExpandableCard
        title="Atlas Search"
        darkMode={false}
      >
        <Code language={'javascript'}>
          {indexes ? JSON.stringify(indexes.searchIndex,null,2) : "" }
        </Code>
      </ExpandableCard>
      <br/>    
      <ExpandableCard
        title="Atlas Vector Search"
        darkMode={false}
      >
        <Code language={'javascript'}>
          {indexes ? JSON.stringify(indexes.vectorIndex,null,2) : "" }
        </Code>
      </ExpandableCard>   
    </Modal>
    </>
  )
}

async function embedQuery(query){
  try{
    const embeddingResp = await axios.get('api/embed?terms='+query);
    return embeddingResp.data;
  }catch (e) {
    throw e;
  }
}

async function getIndexes(){
  try{
    const response = await axios.get('api/indexes');
    return response.data;
  }catch (e) {
    throw e;
  }
}

export default function App(){
  return (
    <ToastProvider>
      <Home/>
    </ToastProvider>
  )
}