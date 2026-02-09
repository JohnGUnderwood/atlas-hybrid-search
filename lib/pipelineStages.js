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

export {searchStage, projectStage, vectorSearchStage, lexicalCompound};