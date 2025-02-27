import axios from 'axios';
import { createRouter } from 'next-connect';

class Model {
    constructor(apiKey){
        this.name = 'nomic';
        this.model = process.env.EMBEDDING_MODEL || "nomic-embed-text-v1";
        this.apiKey = apiKey;
        this.dimensions = process.env.DIMENSIONS?parseInt(process.env.DIMENSIONS):1024;
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

    embed = async function(string){
        try{
            const resp = await this.client.post(
                "embedding/text",
                {model:this.model,"texts":[string]}
            );
            return resp.data.embeddings[0];
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
  
const nomic = createRouter();
nomic.use(middleware);
  
export default nomic;