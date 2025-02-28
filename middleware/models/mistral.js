import MistralClient from '@mistralai/mistralai';

class MistralModel {
    constructor(apiKey){
        this.provider = 'mistral';
        this.model = process.env.EMBEDDING_MODEL || "mistral-embed";
        this.apiKey = apiKey;
        this.dimensions = process.env.DIMENSIONS?parseInt(process.env.DIMENSIONS):768;
        try{
            this.client = new MistralClient(apiKey);
        }catch(error){
            console.log(`Connection failed ${error}`)
            throw error;
        }
    }

    embed = async function(string,type){
        try{
            const resp = await this.client.embeddings({
                model:this.model,
                input: [string]
            })
            return resp.data[0].embedding;
        }catch(error){
            console.log(`Failed to create embeddings ${error}`)
            throw error;
        }
    }
}

export { MistralModel }