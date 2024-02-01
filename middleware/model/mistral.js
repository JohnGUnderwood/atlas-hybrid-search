import MistralClient from '@mistralai/mistralai';
import { createRouter } from 'next-connect';

class Model {
    constructor(apiKey){
        this.apiKey = apiKey
        try{
            this.model = new MistralClient(apiKey);
        }catch(error){
            console.log(`Connection failed ${error}`)
            throw error;
        }
    }

    embed = async function(string){
        try{
            const resp = await this.model.embeddings({
                model:"mistral-embed",
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
    const model = new Model(process.env.OPENAIAPIKEY);
    req.model = model;
    return next();
}
  
const mistral = createRouter();
mistral.use(middleware);
  
export default mistral;