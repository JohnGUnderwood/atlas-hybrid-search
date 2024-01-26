// Relative Score Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import { Label } from '@leafygreen-ui/typography';
import Button from '@leafygreen-ui/button';



function RSF({query,queryVector,schema}){
    const [results, setResults] = useState(null);

    // CONFIGURATION PARAMETERS
    const [config, setConfig] = useState({
        vector_penalty : {val:1,range:[0,20],step:1,comment:"Penalise vector results score"},
        fts_penalty : {val:10,range:[0,20],step:1,comment:"Penalise text search results score"}, 
        k : {val:10,range:[1,25],step:1,comment:"Number of results"},
        overrequest_factor : {val:10,range:[1,25],step:1,comment:"Multiplication factor of k for numCandidates for HNSW search"}
    })

    const resetConfig = () => {
        setConfig({
            vector_penalty : {val:1,range:[0,20],step:1,comment:"Penalise vector results score"},
            fts_penalty : {val:10,range:[0,20],step:1,comment:"Penalise text search results score"}, 
            k : {val:10,range:[1,25],step:1,comment:"Number of results"},
            overrequest_factor : {val:10,range:[1,25],step:1,comment:"Multiplication factor of k for numCandidates for HNSW search"}
        });
    }

    const handleSliderChange = (param, newValue) => {
        setConfig({
            ...config,
            [param]: {
                ...config[param],
                val:newValue
            }
            });
      };

    useEffect(() => {
        if(queryVector){
            search(query,queryVector,schema,config)
            .then(resp => setResults(resp.data.results))
            .catch(error => console.log(error));
        }
    
    },[queryVector,config]);

    return (
        <div style={{display:"grid",gridTemplateColumns:"20% 80%",gap:"5px",alignItems:"start"}}>
            <div>
                <h2>Relative Score Fusion Params</h2>
                <div style={{maxWidth:"60px"}}><Button onClick={()=>resetConfig()} variant="primary">Reset</Button></div>
                {Object.keys(config).map(param=>(
                    <>
                    <p key={param+"_title"}>{param}</p>
                    <p key={param+"_comment"}><i>{config[param]['comment']}</i></p>
                    <Label key={param}>
                        <input
                            key={param+'_slider'}
                            style={{verticalAlign:"bottom"}}
                            type="range"
                            min={config[param]['range'][0]} 
                            max={config[param]['range'][1]}
                            step={config[param]['step']} 
                            value={config[param]['val']} 
                            onChange={(e) => handleSliderChange(param, e.target.value)}
                        />
                        <input
                            key={param+'_box'}
                            style={{width:"3lvh"}}
                            type="text"
                            value={config[param]['val']} 
                            onChange={(e) => handleSliderChange(param, e.target.value)}
                        />
                    </Label>
                    </>
                ))}
            
            </div>
            <Results results={results} msg={"numCandidates: "+(config.k.val * config.overrequest_factor.val)}/>
        </div>
    )
}

export default RSF;

async function search(query,queryVector,schema,config) {
    

    const pipeline = [
        {
          $vectorSearch: {
            index: "vectorIndex",
            path: `${schema.vectorField}`,
            queryVector: queryVector,
            numCandidates: config.k.val * config.overrequest_factor.val,
            limit: config.k.val * 2
          }
        },
        {
          $group: {
            _id: null,
            docs: {$push: "$$ROOT"}
          }
        },
        {
          $unwind: {
            path: "$docs", 
            includeArrayIndex: "rank"
          }
        },
        {
          $addFields: {
            vs_score: {
              $divide: [1.0, {$add: ["$rank", config.vector_penalty.val, 1]}]
            }
          }
        },
        {
          $project: {
            vs_score: 1, 
            _id: 1, 
            title:`$${schema.titleField}`,
            image:`$${schema.imageField}`,
            description:`$${schema.descriptionField}`
          }
        },
        {
          $unionWith: {
            coll: "embedded_movies",
            pipeline: [
              {
                $search: {
                    index: "searchIndex",
                    text: {query: query, path: {wildcard:"*"}},
                }
              },
              {
                $limit: config.k.val
              },
              {
                $group: {
                  _id: null,
                  docs: {$push: "$$ROOT"}
                }
              },
              {
                $unwind: {
                  path: "$docs", 
                  includeArrayIndex: "rank"
                }
              },
              {
                $addFields: {
                  fts_score: {
                    $divide: [
                      1.0,
                      {$add: ["$rank", config.fts_penalty.val, 1]}
                    ]
                  }
                }
              },
              {
                $project: {
                    fts_score: 1,
                    _id: 1,
                    title:`$${schema.titleField}`,
                    image:`$${schema.imageField}`,
                    description:`$${schema.descriptionField}`
                }
              }
            ]
          }
        },
        {
          $group: {
            _id: "$_id",
            vs_score: {$max: "$vs_score"},
            fts_score: {$max: "$fts_score"},
            title:{$first:"$title"},
            image:{$first:"$image"},
            description:{$first:"$description"}
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            image:1,
            desription:1,
            vs_score: {$ifNull: ["$vs_score", 0]},
            fts_score: {$ifNull: ["$fts_score", 0]},
            score: {$add: ["$fts_score", "$vs_score"]},
          }
        },
        {$limit: config.k.val},
        {$sort: {score: -1}}
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