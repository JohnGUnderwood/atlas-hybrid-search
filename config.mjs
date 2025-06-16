// schema variables
// Display fields in results
// descriptionField :// this field is used for reranking if turned on.
// titleField : // this field is used for displaying the title in the results. And as fallback for reranking.,
// imageField : // this field is used for displaying the image in the results.,
// An additional fields for searching over
// searchFields: [],
// Vector search field
// vectorField : // this field is used for vector search.,
// Source for embedding when using embed-data.mjs. 
// If more than one value they are concatenated before embedding using: <fieldname>: <fieldvalue>\n
// vectorSourceField: ""|[],
const config = {
    default:{
        descriptionField : "plot",
        titleField : "title",
        imageField : "poster",
        searchFields: ["cast, genres"],
        vectorField : "plot_embedding",
        vectorSourceField: "plot"
    }, 
    movies:{
        descriptionField : "fullplot",
        titleField : "title",
        imageField : "poster",
        searchFields: ["cast","genres"],
        vectorField : "voyage_doc_embedding",
        vectorSourceField: ["title","fullplot","cast","genres"],
    },
    best_buy:{
        descriptionField : "shortDescription", 
        titleField : "name",
        imageField : "image",
        searchFields: ["class"],
        vectorField : "name_embedding",
        vectorSourceField: "name"
    },
    deployed:{
        descriptionField : "fullplot",
        titleField : "title",
        imageField : "poster",
        searchFields: ["cast","genres"],
        vectorField : "doc_embedding",
        vectorSourceField: ["title","fullplot","cast","genres"],
    },
    amazon:{
        descriptionField : "name",
        titleField : "name",
        imageField : "image_url",
        searchFields: ["main_category","sub_category"],
        vectorField : "embedding",
        vectorSourceField: ["name","main_category","sub_category"]
    },
    news:{
        descriptionField : "content",
        titleField : "title",
        imageField : "image",
        searchFields: ["author"],
        vectorField : "content",
        vectorSourceField: "content"
    }
}
export default config;