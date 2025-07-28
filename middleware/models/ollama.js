import axios from "axios";
class OllamaModel {
    constructor(){
        this.provider = 'ollama';
        this.model = process.env.EMBEDDING_MODEL || "nomic-embed-text";

        try{
            this.client = axios.create({
                baseURL: "http://localhost:11434/api/",
                timeout: 3000,
                headers: {"Content-Type": "application/json"}
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
                {
                    model:this.model,
                    prompt: string
                }
            );
            return resp.data.embedding;
        }catch(error){
            console.log(`Failed to create embeddings ${error}`)
            throw error;
        }
    }
}
export { OllamaModel }