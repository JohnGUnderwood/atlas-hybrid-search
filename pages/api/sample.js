import { createRouter } from 'next-connect';
import database from '../../middleware/database';

const router = createRouter();

router.use(database);

router.get(async (req, res) => {
    try{
        const response = await req.collection.aggregate([{ $sample: { size: 1 } }]).toArray();
        res.status(200).json(response[0]);
    }catch(error){
        res.status(405).json({'error':`${error}`});
    }
});

export default router.handler();