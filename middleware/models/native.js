import { rerankStage } from "../../lib/pipelineStages";

class NativeModel {
    constructor(){
        this.provider = 'native';
        this.rerank_model = process.env.RERANK_MODEL || "rerank-2.5";
    }

    rerank = async function(query, documents, database, schema) {
        const path = ['title', 'description', ...((schema && schema.searchFields) || [])];
        const results = await database.aggregate(
            [
                { $documents: documents },
                rerankStage(query, path, this.rerank_model, documents.length)
            ]
        ).toArray();
        return results;
    }
}

export { NativeModel };