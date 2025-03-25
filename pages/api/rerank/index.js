// /api/rerank route

import { baseRouter } from "../../../middleware/router";

const router = baseRouter.clone();
router.post(async (req, res) => {
    if(!req.body.query && !req.body.documents){
        console.log(`Request body must have 'query' and 'documents'`)
        res.status(400).send(`Request body must have 'query' and 'documents'`);
    }else{
        try{
            const newResults = await req.rerank_model.rerank(req.body.query,req.body.documents);
            res.status(200).json(newResults);
        }catch(error){
            console.log(error);
            res.status(405).json(error);
        }
    }
});

export default router.handler();