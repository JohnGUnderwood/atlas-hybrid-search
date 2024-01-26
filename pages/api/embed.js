import { createRouter } from 'next-connect';
import openai from '../../middleware/openai';

async function embed(model,string){
    try{
        return model.embeddings.create({
            model:"text-embedding-ada-002",
            input:string,
            encoding_format:"float"
          });
    }catch(error){
        console.log(`Failed to create embeddings ${error}`)
        throw error;
    }
}

const router = createRouter();

router.use(openai);

router.get(async (req, res) => {
    if(!req.query.terms){
        console.log(`Request missing 'terms' parameter`)
        res.status(400).send(`Request missing 'terms' parameter`);
    }else{
        const string = req.query.terms
        try{
            const response = await embed(req.model,string);
            res.status(200).json(response.data[0].embedding);
        }catch(error){
            res.status(405).json(error);
        }
    }
});

export default router.handler();