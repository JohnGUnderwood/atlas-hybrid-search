import axios from "axios";
class AtlasVoyageModel {
    constructor(apiKey){
        this.provider = 'atlas';
        this.model = process.env.EMBEDDING_MODEL || "voyage-4";
        this.rerank_model = process.env.RERANK_MODEL || "rerank-2.5";
        this.apiKey = apiKey;
        this.dimensions = process.env.DIMENSIONS?parseInt(process.env.DIMENSIONS):1024;
        try{
            this.client = axios.create({
                baseURL: "https://ai.mongodb.com/v1/",
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
        const docStrings = documents.map((doc) => {
            if(doc.description){
                return doc.description;
            }else if(doc.title){
                return doc.title;
            }else{
                return "";
            }
        });
        try{
            const resp = await this.client.post(
                "rerank",
                {model:this.rerank_model,query:query,documents:docStrings}
            );
            const reranked = resp.data.data.map((r,idx) => {
                var doc = docMap[`${r.index}`];
                if(idx < parseInt(r.index)){
                    doc.reranked = "moved up"
                }else if(idx > parseInt(r.index)){
                    doc.reranked = "moved down"
                }else{
                    doc.reranked = "not reranked"
                }
                doc.rerank_score = r.relevance_score;
                return doc;
            });
            return reranked;
        }catch(error){
            console.log(`Failed to rerank documents ${error}`)
            throw error;
        }
    }
}
export { AtlasVoyageModel }