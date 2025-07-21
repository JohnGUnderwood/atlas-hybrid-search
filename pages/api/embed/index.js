// /api/embed route
import { baseRouter } from "../../../middleware/router";

const router = baseRouter.clone();
router.get(async (req, res) => {
    if(!req.query.terms){
        console.log(`Request missing 'terms' parameter`)
        res.status(400).send(`Request missing 'terms' parameter`);
    }else{
        const string = req.query.terms

        let embeddingType = 'query'; // default embedding type is 'query'
        if(req.query.type){
            embeddingType = `${req.query.type}`.toLowerCase();
        }
        if(embeddingType != 'query' && embeddingType != 'document'){
            console.log(`Request parameter 'type' must be 'query' or 'document'`)
            res.status(400).send(`Request parameter 'type' must be 'query' or 'document'`);
        }

        let cacheQuery = true;
        if(req.query.cache){
            cacheQuery = (`${req.query.cache}`.toLowerCase() == 'true');
        }
        try{
            const response = await req.model.embed(string,embeddingType);
            if(cacheQuery){
                const provider = req.model.provider;
                const model = req.model.model;
                const dimensions = response.length;
                const collection = req.db.collection('query_cache');
                const _id = `${string}_${provider}_${model}_${dimensions.toString()}`.toLowerCase();
                collection.updateOne(
                    {_id:_id},
                    {$setOnInsert: {
                            _id:_id,
                            query:string,
                            embedding:response,
                            provider:provider,
                            model:model,
                            dimensions:dimensions,
                            lastAccessed: new Date(),
                            count:1
                        }
                    },
                    {upsert:true}
                );
            }  
            res.status(200).json(response);
        }catch(error){
            console.log(error);
            res.status(405).json(error);
        }
    }
});


export default router.handler();