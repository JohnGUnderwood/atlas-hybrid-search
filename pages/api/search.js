import { createRouter } from 'next-connect';
import database from '../../middleware/database';

async function getResults(collection,pipeline){
    try{
        const results = await collection.aggregate(pipeline).toArray();
        return results;
    }catch(error){
        throw error
    }
}

const router = createRouter();

router.use(database);

router.post(async (req, res) => {
    if(!req.body.pipeline){
        console.log(`Request missing 'pipeline' data`)
        res.status(400).send(`Request missing 'pipeline' data`);
    }else{
        const pipeline = req.body.pipeline
        try{
            const response = await getResults(req.collection,pipeline);
            res.status(200).json({results:response,query:pipeline});
        }catch(error){
            res.status(405).json({'error':`${error}`,query:pipeline});
        }
    }
});

export default router.handler();