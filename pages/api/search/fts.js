// /api/search/fts route

import {searchStage, projectStage} from "../../../lib/pipelineStages";
import getResults from "../../../lib/getResults";
import { baseRouter } from "../../../middleware/router";

const router = baseRouter.clone();
router.post(async (req, res) => {
    if(!req.body.query || !req.body.config){
        console.log(`Request missing required data fields: 'query' or 'config'`)
        res.status(400).send(`Request missing required data fields: 'query' or 'config'`);
    }else{
        const searchIndex = req.searchIndex.name;
        const vectorIndex = req.vectorIndex.name;
        const query = req.body.query;
        const config = req.body.config;
        
        const pipeline = [
            searchStage(query,req.schema),
            projectStage(req.schema),
            {$limit: config.k}
        ]
        try{
            const response = await getResults(req.collection,pipeline,searchIndex,vectorIndex);
            res.status(200).json(response);
        }catch(error){
            res.status(405).json({'error':`${error}`,query:pipeline});
        }
    }

});

export default router.handler();