function projectStage(schema) {
    return {
        $project: {
            score: {$meta: "searchScore"},
            title:`$${schema.titleField}`,
            image:`$${schema.imageField}`,
            description:`$${schema.descriptionField}`,
            ...schema.searchFields.reduce((acc, f) => ({...acc, [f]: `$${f}`}), {}),
            highlights: { $meta: "searchHighlights" },
        }
    }            
}

function lexicalCompound(query, schema) {
    return {
        compound: {
            should: [
                {
                    text: {
                        query: query, 
                        path: [
                            `${schema.titleField}`,
                            `${schema.descriptionField}`,
                            ...schema.searchFields
                        ]
                    }
                },
                {
                    text: {
                        query: query, 
                        path: [
                            `${schema.titleField}`,
                            ...schema.searchFields.map(f => ({'value':`${f}`,'multi':'keywordAnalyzer'}))
                        ],
                        score: {boost: {value: 2}}
                    }
                },
                {
                    phrase: {
                        query: query, 
                        path: `${schema.titleField}`,
                        slop: 0,
                        score: {boost: {value: 2}}
                    }
                },
                {
                    phrase: {
                        query: query, 
                        path: {'value':`${schema.descriptionField}`,'multi':'standardAnalyzer'},
                        slop: 1
                    }
                }
            ]
        }
    };
}

function searchStage(query, schema, config) {
    var operator = lexicalCompound(query, schema)

    // Build compound filter from filterConfig
    const clauses = [];
    const filterConfig = config.filters;
    if (filterConfig && Object.keys(filterConfig).length > 0) {
        Object.entries(filterConfig).forEach(([fieldName, fieldConfig]) => {
            if (fieldConfig.query && fieldConfig.query.trim()) {
                clauses.push({
                    text: {
                        query: fieldConfig.query.trim(),
                        path: fieldName,
                        matchCriteria: fieldConfig.matchCriteria
                    }
                });
            }
        });
        // Filters are added as a must clause for text searches.
        // The number of filters that must match depends on what the user selected('any' or 'all')
        operator.compound.must = {
            compound: {
                should: clauses,
                minimumShouldMatch: filterConfig.__operator === 'must'? clauses.length : 1
            }          
        }
    }    
    
    return {
        $search: {
            index: '',
            ...operator,
            highlight: {path: `${schema.descriptionField}`}
        }
    };
}

function vectorSearchStage(queryVector, schema, config) {
    const stage = {
        $search: {
            index: '',
            vectorSearch: {
                path: `${schema.vectorField}`,
                queryVector: queryVector,
                numCandidates: config.params.numCandidates.val,
                limit: config.params.limit.val
            }
        }
    };
    
    // Build compound filter from filterConfig
    const clauses = [];
    const filterConfig = config.filters;
    if (filterConfig) {
        Object.entries(filterConfig).forEach(([fieldName, fieldConfig]) => {
            if (fieldConfig.query && fieldConfig.query.trim()) {
                clauses.push({
                    text: {
                        query: fieldConfig.query.trim(),
                        path: fieldName,
                        matchCriteria: fieldConfig.matchCriteria
                    }
                });
            }
        });
    }
    
    // Add compound filter if there are any active filters
    if (clauses.length > 0) {
        stage.$search.vectorSearch.filter = {
            compound: {
                [filterConfig?.__operator || 'should']: clauses,
            }
        };
    }

    // If operator is 'should' and there are active filters, require at least one to match
    if (filterConfig?.__operator === 'should' && clauses.length > 0) {
        stage.$search.vectorSearch.filter.compound.minimumShouldMatch = 1;
    }
    return stage;
}

function rerankStage(query, path, modelName, numDocsToRerank) {
    return {
        $rerank: {
            query: { text: query },
            path: path,
            numDocsToRerank: numDocsToRerank,
            model: modelName
        }
    };
}

function rerankStages(query, path, modelName, numDocsToRerank) {
    return [
        { $group: { _id: null, docs: { $push: '$$ROOT' } } },
        { $unwind: { path: '$docs', includeArrayIndex: 'preRerankIndex' } },
        { $replaceRoot: { newRoot: { $mergeObjects: ['$docs', { preRerankIndex: '$preRerankIndex' }] } } },
        rerankStage(query, path, modelName, numDocsToRerank),
        { $addFields: { score: { $meta: 'score' } } },
        { $group: { _id: null, docs: { $push: '$$ROOT' } } },
        { $unwind: { path: '$docs', includeArrayIndex: 'postRerankIndex' } },
        { $replaceRoot: { newRoot: { $mergeObjects: ['$docs', { postRerankIndex: '$postRerankIndex' }] } } },
        {
            $addFields: {
                rerank_score: '$score',
                reranked: {
                    $switch: {
                        branches: [
                            { case: { $lt: ['$postRerankIndex', '$preRerankIndex'] }, then: 'moved up' },
                            { case: { $gt: ['$postRerankIndex', '$preRerankIndex'] }, then: 'moved down' }
                        ],
                        default: 'not reranked'
                    }
                }
            }
        }
    ];
}

// Returns a SetParams-compatible config param for toggling the in-pipeline
// MongoDB $rerank stage. Only available when a native (MongoDB) reranker is
// configured; returns {} otherwise so callers can safely spread it.
function rerankParam(model) {
    return model?.reranking?.provider === 'native'
        ? { rerank: { type: 'checkbox', val: false, comment: 'Apply MongoDB $rerank stage in the query pipeline' } }
        : {};
}

// Appends a $rerank stage (plus a score projection) to a pipeline when the
// in-pipeline rerank toggle is enabled and a native reranker is available.
// Returns the pipeline unchanged otherwise, so it is safe to call everywhere.
// Documents are expected to already be projected to the standard shape
// (title, description, ...searchFields) that every search component produces.
function appendRerankStage(pipeline, { query, schema, model, config }) {
    if (!config?.params?.rerank?.val || model?.reranking?.provider !== 'native') {
        return pipeline;
    }
    const numDocsToRerank = config.params.numCandidates?.val
        ?? config.params.limit?.val
        ?? 100;
    const path = ['title', 'description', ...(schema.searchFields || [])];
    return [
        ...pipeline,
        ...rerankStages(query, path, model.reranking.model, numDocsToRerank)
    ];
}

export {searchStage, projectStage, vectorSearchStage, lexicalCompound, rerankStage, rerankStages, rerankParam, appendRerankStage};