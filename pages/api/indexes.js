import { createRouter } from 'next-connect';
import database from '../../middleware/database';

const router = createRouter();

router.use(database);

router.get(async (req, res) => {
    if(!req.query.type || (req.query.type != 'vector' && req.query.type != 'search')){
        console.log(`Request missing 'type' parameter must be set to 'vector' or 'search'`)
        res.status(400).send(`Request missing 'type' parameter must be set to 'vector' or 'search'`);
    }else{
        if(req.query.type == 'vector'){
            res.status(200).json(req.vectorIndex);
        }else if(req.query.type == 'search'){
            res.status(200).json(req.searchIndex);
        }
    }
});

export default router.handler();