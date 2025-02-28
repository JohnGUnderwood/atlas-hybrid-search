// schema variables
const schema = {
    // Display fields in results
    descriptionField : "fullplot", // this field is used for reranking if turned on.
    titleField : "title",
    imageField : "poster",
    // An additional fields for searching over
    searchFields: ["cast","genres"],
    // Vector search field
    vectorField : "doc_embedding",
    // Source for embedding when using embed-data.mjs. 
    // If more than one value they are concatenated before embedding using: <fieldname>: <fieldvalue>\n
    // vectorSourceField: "fullplot"
    vectorSourceField: ["title","fullplot","cast","genres"],
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