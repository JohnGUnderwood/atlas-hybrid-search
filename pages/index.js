import axios from 'axios';
import Header from '../components/head';
import RSF from '../components/rsf';
import FTS from '../components/fts';
import {SearchInput} from '@leafygreen-ui/search-input';
import { useState, } from 'react';
import Button from '@leafygreen-ui/button';
import { Tabs, Tab } from '@leafygreen-ui/tabs';
import AppBanner from '../components/banner';



// schema variables
const schema = {
  descriptionField : "plot",
  titleField : "title",
  imageField : "poster",
  vectorField : "plot_embedding",
}

export default function Home(){
  const [query, setQuery] = useState("");
  const [queryVector, setQueryVector] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);

  const handleSearch = () => {
    console.log("Search Clicked!")
    if(query && query != ""){
      embedQuery(query)
      .then(resp => {
        console.log("Query Embedded!")
        setQueryVector(resp);
      })
      .catch(error => console.log(error));
    }
  }

  const handleQueryChange = (event) => {
    setQuery(event.target.value);
  };

  return (
    <>
    <Header/>
    <AppBanner heading="Atlas Hybrid Search Tester"></AppBanner>
    <div style={{display:"grid",gridTemplateColumns:"90% 120px",gap:"10px",alignItems:"start"}}>
      <div><SearchInput value={query} onChange={handleQueryChange} aria-label="some label" style={{marginBottom:"20px"}}></SearchInput></div>
      <div style={{maxWidth:"120px"}}><Button onClick={()=>handleSearch()} variant="primary">Vector Search</Button></div>
    </div>
    <Tabs style={{marginTop:"15px"}} setSelected={setSelectedTab} selected={selectedTab}>
      <Tab name="Fulltext Search">
        <FTS query={query} schema={schema}/>
      </Tab>
      <Tab name="Relative Score Fusion">
        <RSF query={query} queryVector={queryVector} schema={schema}/>
      </Tab>
    </Tabs>
    </>
  )
}

function createHighlighting(highlightsField,fieldName,fieldValue) {
  const highlightedStrings = highlightsField.map(h => {
    if(h.path === fieldName){
      return h.texts.map(t => {
        if(t.type === "hit"){
          return "<strong style='color:blue'>"+t.value+"</strong>"
        }else{
          return t.value
        }
        
      }).join('')
    }
  });

  const nonHighlightedStrings = highlightsField.map(h => {
    if(h.path === fieldName){
      return h.texts.map(t => t.value).join('')
    }
  });

  highlightedStrings.forEach((str,idx) => {
    fieldValue = fieldValue.replace(nonHighlightedStrings[idx],str);
  });

  return {__html: fieldValue};
}

async function embedQuery(query){
  try{
    const embeddingResp = await axios.get('api/embed?terms='+query);
    return embeddingResp.data;
  }catch (e) {
    throw e;
  }
}


async function getInstantResults(query) {
  const pipeline = [
      {
        $match:{ $expr : { $eq: [ '$_id' , { $toObjectId: query } ] } }
      },
      // {
      //   $match: { [`${titleField}`] : query }
      // },
      // {
      //   $search:{
      //     index:"searchIndex",
      //     // text:{
      //     //       query:query,
      //     //       path:{wildcard:"*"}
      //     //   },
      //     // autocomplete:{
      //     //       query:query,
      //     //       path:`${titleField}`
      //     //   },
      //     // highlight:{
      //     //   path:`${descriptionField}`
      //     // },
      //     // compound:{
      //     //   should:[
      //     //     {
      //     //       text:{
      //     //         query:query,
      //     //         path:{wildcard:"*"},
      //     //         // fuzzy:{
      //     //         //   maxEdits:1,
      //     //         //   maxExpansions:10
      //     //         // }
      //     //       }
      //     //     },
      //     //     {
      //     //       autocomplete:{
      //     //           query:query,
      //     //           path:`${titleField}`
      //     //       }
      //     //     }
      //     //   ]
      //     // },
      //     // facet:{
      //     //   operator:{
      //     //     compound:{
      //     //       should:[
      //     //         {
      //     //           text:{
      //     //             query:query,
      //     //             path:{wildcard:"*"},
      //     //             // fuzzy:{
      //     //             //   maxEdits:1,
      //     //             //   maxExpansions:10
      //     //             // }
      //     //           }
      //     //         },
      //     //         {
      //     //           autocomplete:{
      //     //               query:query,
      //     //               path:`${titleField}`
      //     //           }
      //     //         }
      //     //       ]
      //     //     }
      //     //   },
      //     //   facets:{
      //     //     genres:{
      //     //       type:"string",
      //     //       path:`${facetField}`
      //     //     }
      //     //   }
      //     // }
      //   },
      // },
      {
          $limit:10
      },
      {
          $project:{
            title:`$${titleField}`,
            image:`$${imageField}`,
            description:`$${descriptionField}`,
            highlights: { $meta: "searchHighlights" },
            score:{$meta:"searchScore"},
            // facets:"$$SEARCH_META"
          }
      }
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
