// schema variables
const schema = {
    // display fields in results
    descriptionField : "plot", 
    titleField : "title",
    imageField : "poster",
    // vector search field
    vectorField : "nomic_plot_embedding",
    // source for embedding when using embed-data.mjs
    vectorSourceField: "plot"
}

export default schema;