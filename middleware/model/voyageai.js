import axios from 'axios';
import { createRouter } from 'next-connect';

class Model {
    constructor(apiKey){
        this.name = 'voyageai';
        this.apiKey = apiKey
        this.dimensions = process.env.DIMENSIONS?parseInt(process.env.DIMENSIONS):1024;
        try{
            this.model = axios.create({
                baseURL: "https://api.voyageai.com/v1/",
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
            const model = process.env.VOYAGEMODEL || "voyage-3";
            const resp = await this.model.post(
                "embeddings",
                {model:model,input:[string],output_dimension:this.dimensions}
            );
            return resp.data.data[0].embedding;
        }catch(error){
            console.log(`Failed to create embeddings ${error}`)
            throw error;
        }
    }
}

async function middleware(req,res,next) {
    const model = new Model(process.env.VOYAGEAPIKEY);
    req.model = model;
    return next();
}
  
const voyageai = createRouter();
voyageai.use(middleware);
  
export default voyageai;