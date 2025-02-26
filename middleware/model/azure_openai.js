import { OpenAIClient, AzureKeyCredential,  } from "@azure/openai";
import { createRouter } from 'next-connect';

class Model {
    
    constructor(apiKey){
        this.name = 'azure_openai';
        this.apiKey = apiKey
        this.dimensions = process.env.DIMENSIONS?parseInt(process.env.DIMENSIONS):1536;
        try{
            this.model = new OpenAIClient(
                process.env.OPENAIENDPOINT,
                new AzureKeyCredential(process.env.OPENAIAPIKEY)
            );
        }catch(error){
            console.log(`Connection failed ${error}`)
            throw error;
        }
    }

    embed = async function(string){
        try{
            const resp = await this.model.getEmbeddings(
                process.env.OPENAIDEPLOYMENT,
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
    const model = new Model(process.env.OPENAIAPIKEY);
    req.model = model;
    return next();
}
  
const azure_openai = createRouter();
azure_openai.use(middleware);
  
export default azure_openai;