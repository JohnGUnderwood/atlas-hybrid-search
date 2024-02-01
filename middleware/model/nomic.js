import axios from 'axios';
import { createRouter } from 'next-connect';

class Model {
    constructor(apiKey){
        this.apiKey = apiKey
        try{
            this.model = axios.create({
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
            const resp = await this.model.post(
                "embedding/text",
                {model:"nomic-embed-text-v1","texts":[string]}
            );
            return resp.data.embeddings[0];
        }catch(error){
            console.log(`Failed to create embeddings ${error}`)
            throw error;
        }
    }
}

async function middleware(req,res,next) {
    const model = new Model(process.env.NOMICAPIKEY);
    req.model = model;
    return next();
}
  
const nomic = createRouter();
nomic.use(middleware);
  
export default nomic;