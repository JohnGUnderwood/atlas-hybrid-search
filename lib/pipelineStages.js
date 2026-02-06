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

function searchStage(query, schema) {
    return {
        $search: {
            index: '',
            ...lexicalCompound(query, schema),
            highlight: {path: `${schema.descriptionField}`}
        }
    };
}

function vectorSearchStage(queryVector, schema, numCandidates, limit, enablePrefilter, query = null) {
    const stage = {
        $search: {
            index: '',
            vectorSearch: {
                path: `${schema.vectorField}`,
                queryVector: queryVector,
                numCandidates: numCandidates,
                limit: limit
            }
        }
    };
    
    // Add lexical prefiltering if enabled and query is provided
    if (enablePrefilter !== "none" && query) {
        stage.$search.vectorSearch.filter = {
            text: {
                matchCriteria: enablePrefilter,
                query: query, 
                path: [
                    `${schema.titleField}`,
                    `${schema.descriptionField}`,
                    ...schema.searchFields
                ]
            }
        };
    }
    
    return stage;
}

export {searchStage, projectStage, vectorSearchStage, lexicalCompound};