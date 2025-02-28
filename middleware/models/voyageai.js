import axios from "axios";
class VoyageAIModel {
    constructor(apiKey){
        this.provider = 'voyageai';
        this.model = process.env.EMBEDDING_MODEL || "voyage-3";
        this.rerank_model = process.env.RERANK_MODEL || "rerank-2-lite";
        this.apiKey = apiKey;
        this.dimensions = process.env.DIMENSIONS?parseInt(process.env.DIMENSIONS):1024;
        try{
            this.client = axios.create({
                baseURL: "https://api.voyageai.com/v1/",
                timeout: 3000,
                headers: {"Content-Type": "application/json","Authorization":`Bearer ${apiKey}`}
              });
        }catch(error){
            console.log(`Connection failed ${error}`)
            throw error;
        }
    }

    embed = async function(string,type){
        try{
            const resp = await this.client.post(
                "embeddings",
                {model:this.model,input:[string],output_dimension:this.dimensions,input_type:type}
            );
            return resp.data.data[0].embedding;
        }catch(error){
            console.log(`Failed to create embeddings ${error}`)
            throw error;
        }
    }

    rerank = async function(query,documents){
        const docMap = {}
        documents.forEach((doc,index) => {
            docMap[index] = doc;
        });
        const docStrings = documents.map((doc) => doc.description);
        try{
            const resp = await this.client.post(
                "rerank",
                {model:this.rerank_model,query:query,documents:docStrings}
            );
            const reranked = resp.data.data.map(r => { var doc = docMap[`${r.index}`]; doc.rerank_score = r.relevance_score; return doc; });
            return reranked;
        }catch(error){
            console.log(`Failed to rerank documents ${error}`)
            throw error;
        }
    }
}
export { VoyageAIModel }