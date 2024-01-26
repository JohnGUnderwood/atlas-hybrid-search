import OpenAI from 'openai';
import { createRouter } from 'next-connect';


async function get(){
    try{
        const key = process.env.OPENAI_API_KEY;
        const openai = new OpenAI({apiKey:key});
        return openai;
    }catch(error){
        console.log(`Connection failed ${error}`)
        throw error;
    }
}


async function middleware(req, res, next) {
    req.model = await get();
    return next();
  }
  
  const openai = createRouter();
  openai.use(middleware);
  
  export default openai;