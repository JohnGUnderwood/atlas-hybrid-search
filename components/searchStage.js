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
                            ...schema.searchFields
                        ]
                    }
                },
                {
                    text: {query: query, 
                        path: [
                            `${schema.titleField}`,
                            ...schema.searchFields.map(f => ({'value':`${f}`,'multi':'keywordAnalyzer'}))
                        ],
                        score: {boost: {value: 2}}
                    }
                },
                {
                    phrase: {query: query, 
                        path: `${schema.titleField}`,
                        slop:0,
                        score: {boost: {value: 2}}
                    }
                },
                {
                    phrase: {query: query, 
                        path: {'value':`${schema.descriptionField}`,'multi':'standardAnalyzer'},
                        slop:1,
                    }
                }
            ]
        },
        highlight:{path:`${schema.descriptionField}`}
    }};
}

export default searchStage;