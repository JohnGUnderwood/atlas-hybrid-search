import { createRouter } from 'next-connect';
import database from '../../middleware/database';

const router = createRouter();

router.use(database);

router.get(async (req, res) => {
    
    if(req.query.type == 'vector'){
        res.status(200).json(req.vectorIndex);
    }else if(req.query.type == 'search'){
        res.status(200).json(req.searchIndex);
    }else{
        res.status(200).json({searchIndex:req.searchIndex,vectorIndex:req.vectorIndex});
    }
});

export default router.handler();