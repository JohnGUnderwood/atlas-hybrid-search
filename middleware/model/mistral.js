import MistralClient from '@mistralai/mistralai';
import { createRouter } from 'next-connect';

class Model {
    constructor(apiKey){
        this.name = 'mistral';
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

    embed = async function(string){
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

async function middleware(req,res,next) {
    const model = new Model(process.env.APIKEY);
    req.model = model;
    return next();
}
  
const mistral = createRouter();
mistral.use(middleware);
  
export default mistral;