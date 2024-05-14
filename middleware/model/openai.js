import OpenAI from 'openai';
import { createRouter } from 'next-connect';

class Model {
    constructor(apiKey){
        this.apiKey = apiKey
        try{
            this.model = new OpenAI({apiKey:apiKey});
        }catch(error){
            console.log(`Connection failed ${error}`)
            throw error;
        }
    }

    embed = async function(string){
        try{
            const resp = await this.model.embeddings.create({
                model:process.env.OPENAIEMBEDDINGMODEL,
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
    const model = new Model(process.env.OPENAIAPIKEY);
    req.model = model;
    return next();
}
  
const openai = createRouter();
openai.use(middleware);
  
export default openai;