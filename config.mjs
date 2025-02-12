// schema variables
const schema = {
    // display fields in results
    descriptionField : "plot", 
    titleField : "title",
    imageField : "poster",
    // an additional fields for searching over
    searchFields: ["cast","genres"],
    // vector search field
    vectorField : "plot_embedding",
    // source for embedding when using embed-data.mjs
    vectorSourceField: "plot"
}

// const schema = {
//     // display fields in results
//     descriptionField : "shortDescription", 
//     titleField : "name",
//     imageField : "image",
//     // an additional fields for searching over
//     searchFields: ["class"],
//     // vector search field
//     vectorField : "name_embedding",
//     // source for embedding when using embed-data.mjs
//     vectorSourceField: "name"
// }

export default schema;