// Relative Score Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import SetParams from "./set-params";

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
                val:parseFloat(newValue)
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
            <SetParams config={config} resetConfig={resetConfig} handleSliderChange={handleSliderChange} heading="Reciprocal Rank Fusion Params"/>
            <Results results={results} msg={"numCandidates: "+(config.k.val * config.overrequest_factor.val)}/>
        </div>
    )
}

export default RSF;

async function search(query,queryVector,schema,config) {
    

    const pipeline = [
        {
          $vectorSearch: {
            index: schema.vectorIndex,
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
            _id: "$docs._id", 
            title:`$docs.${schema.titleField}`,
            image:`$docs.${schema.imageField}`,
            description:`$docs.${schema.descriptionField}`
          }
        },
        {
          $unionWith: {
            coll: schema.searchCollection,
            pipeline: [
              {
                $search: {
                    index: schema.searchIndex,
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
                    _id:"$docs._id",
                    title:`$docs.${schema.titleField}`,
                    image:`$docs.${schema.imageField}`,
                    description:`$docs.${schema.descriptionField}`
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
              description:1,
              vs_score: {$ifNull: ["$vs_score", 0]},
              fts_score: {$ifNull: ["$fts_score", 0]},
            }
          },
        {
          $project: {
            _id: 1,
            title: 1,
            image:1,
            description:1,
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