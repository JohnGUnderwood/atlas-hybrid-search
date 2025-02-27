import { baseRouter } from "../../../middleware/router";

const router = baseRouter.clone();

router.get(async (req, res) => {
    if(!req.query.terms){
        console.log(`Request missing 'terms' param`)
        res.status(400).send(`Request missing 'terms' param`);
    }else{
        try{
            const response = await req.db.collection('query_cache').findOne({
                _id:`${req.query.terms}_${req.model.name}_${req.model.model}_${req.model.dimensions}`.toLowerCase()
            });
            if(response){
                res.status(200).json(response.embedding);
            }else{
                res.status(204).send();
            }
        }catch(error){
            res.status(405).json({'error':`${error}`,terms:req.query.terms});
        }
    }
});

export default router.handler();