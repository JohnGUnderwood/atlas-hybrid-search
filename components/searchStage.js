function searchStage(query, schema) {
    return {$search: {
        index: '',
        compound: {
            should:[
                {
                    text: {query: query, 
                        path: [
                            `${schema.titleField}`,
                            `${schema.descriptionField}`,
                            ...schema.searchFields,
                            ...schema.searchFields.map(f => ({'value':`${f}`,'multi':'keywordAnalyzer'}))
                        ]
                    }
                },
                {
                    text: {query: query, 
                        path: [
                            ...schema.searchFields.map(f => ({'value':`${f}`,'multi':'keywordAnalyzer'}))
                        ],
                        score: {boost: {value: 2}}
                    }
                }
            ]
        },
        highlight:{path:`${schema.descriptionField}`}
    }};
}

export default searchStage;