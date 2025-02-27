import { OpenAIClient, AzureKeyCredential,  } from "@azure/openai";
import { createRouter } from 'next-connect';

class Model {
    
    constructor(apiKey){
        this.name = 'azure_openai';
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

    embed = async function(string){
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

async function middleware(req, res, next) {
    const model = new Model(process.env.APIKEY || process.env.OPENAIAPIKEY); // Use APIKEY if set, otherwise use OPENAIAPIKEY
    req.model = model;
    return next();
}
  
const azure_openai = createRouter();
azure_openai.use(middleware);
  
export default azure_openai;