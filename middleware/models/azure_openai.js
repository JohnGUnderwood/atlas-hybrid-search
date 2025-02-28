import { OpenAIClient, AzureKeyCredential,  } from "@azure/openai";

class AzureOpenAIModel {
    
    constructor(apiKey){
        this.provider = 'azure_openai';
        this.model = process.env.OPENAIDEPLOYMENT
        this.apiKey = apiKey
        this.dimensions = process.env.DIMENSIONS?parseInt(process.env.DIMENSIONS):1536;
        try{
            this.client = new OpenAIClient(
                process.env.OPENAIENDPOINT,
                new AzureKeyCredential(apiKey)
            );
        }catch(error){
            console.log(`Connection failed ${error}`)
            throw error;
        }
    }

    embed = async function(string,type){
        try{
            const resp = await this.client.getEmbeddings(
                this.model,
                string
            )
            return resp.data[0].embedding;
        }catch(error){
            console.log(`Failed to create embeddings ${error}`)
            throw error;
        }
    }
}

export { AzureOpenAIModel }