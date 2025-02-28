import axios from 'axios';
class NomicModel {
    constructor(apiKey){
        this.provider = 'nomic';
        this.model = process.env.EMBEDDING_MODEL || "nomic-embed-text-v1";
        this.apiKey = apiKey;
        this.dimensions = process.env.DIMENSIONS?parseInt(process.env.DIMENSIONS):768;
        try{
            this.client = axios.create({
                baseURL: "https://api-atlas.nomic.ai/v1/",
                timeout: 1000,
                headers: {"Content-Type": "application/json","Authorization":`Bearer ${apiKey}`}
              });
        }catch(error){
            console.log(`Connection failed ${error}`)
            throw error;
        }
    }

    embed = async function(string,type){
        if(type == "query"){
            type = "search_query"
        }else if(type == "document"){
            type = "search_document"
        }
        try{
            const resp = await this.client.post(
                "embedding/text",
                {model:this.model,"texts":[string],task_type:type}
            );
            return resp.data.embeddings[0];
        }catch(error){
            console.log(`Failed to create embeddings ${error}`)
            throw error;
        }
    }
}

export { NomicModel }