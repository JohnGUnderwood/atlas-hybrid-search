import OpenAI from 'openai';

class OpenAIModel {
    constructor(apiKey){
        this.provider = 'openai';
        this.model = process.env.EMBEDDING_MODEL || "text-embedding-ada-002";
        this.apiKey = apiKey
        this.dimensions = process.env.DIMENSIONS?parseInt(process.env.DIMENSIONS):1536;
        try{
            this.client = new OpenAI({apiKey:apiKey});
        }catch(error){
            console.log(`Connection failed ${error}`)
            throw error;
        }
    }

    embed = async function(string,type){
        try{
            const resp = await this.client.embeddings.create({
                model:this.model,
                input:string,
                encoding_format:"float",
                dimensions: this.dimensions,
              })
            return resp.data[0].embedding;
        }catch(error){
            console.log(`Failed to create embeddings ${error}`)
            throw error;
        }
    }
}

export { OpenAIModel }
