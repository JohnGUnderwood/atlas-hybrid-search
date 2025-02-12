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

export default projectStage;