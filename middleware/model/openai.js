import OpenAI from 'openai';
import { createRouter } from 'next-connect';

class Model {
    constructor(apiKey){
        this.name = 'openai';
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
                encoding_format:"float"
              })
            return resp.data[0].embedding;
        }catch(error){
            console.log(`Failed to create embeddings ${error}`)
            throw error;
        }
    }
}

async function middleware(req, res, next) {
    // req.model = await get();
    const model = new Model(process.env.APIKEY);
    req.model = model;
    return next();
}
  
const openai = createRouter();
openai.use(middleware);
  
export default openai;