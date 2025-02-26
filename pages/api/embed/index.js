import { baseRouter } from '../../../middleware/router';

const router = baseRouter.clone();
router.get(async (req, res) => {
    if(!req.query.terms){
        console.log(`Request missing 'terms' parameter`)
        res.status(400).send(`Request missing 'terms' parameter`);
    }else{
        const string = req.query.terms
        try{
            const response = await req.model.embed(string);
            const name = req.model.name;
            const dimensions = response.length;
            const collection = req.db.collection('query_cache');
            const _id = `${string}_${name}_${dimensions.toString()}`.toLowerCase();
            collection.updateOne(
                {_id:_id},
                {$setOnInsert: {
                    _id:_id,
                    embedding:response,
                    model:name,
                    dimensions:dimensions
                    }
                },
                {upsert:true}
            );  
            res.status(200).json(response);
        }catch(error){
            res.status(405).json(error);
        }
    }
});


export default router.handler();