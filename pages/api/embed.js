import { createRouter } from 'next-connect';
import openai from '../../middleware/model/openai';
import azure_openai from '../../middleware/model/azure_openai';


const router = createRouter();

if(process.env.OPENAIENDPOINT && process.env.OPENAIDEPLOYMENT && process.env.OPENAIAPIKEY){
    router.use(azure_openai);
    console.log("Using Azure OpenAI embeddings");
}else if(process.env.OPENAIAPIKEY){
    router.use(openai);
    console.log("Using OpenAI embeddings");
}

router.get(async (req, res) => {
    if(!req.query.terms){
        console.log(`Request missing 'terms' parameter`)
        res.status(400).send(`Request missing 'terms' parameter`);
    }else{
        const string = req.query.terms
        try{
            const response = await req.model.embed(string);
            res.status(200).json(response);
        }catch(error){
            res.status(405).json(error);
        }
    }
});

export default router.handler();