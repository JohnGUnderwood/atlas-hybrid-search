// /api/search/vector route

import getResults from "../../../lib/getResults";
import { baseRouter } from "../../../middleware/router";

const router = baseRouter.clone();
router.post(async (req, res) => {
    if(!req.body.config || !req.body.queryVector){
        console.log(`Request missing required data fields: 'queryVector' or 'config'`)
        res.status(400).send(`Request missing required data fields: 'queryVector' or 'config'`);
    }else{
        const searchIndex = req.searchIndex.name;
        const vectorIndex = req.vectorIndex.name;
        const queryVector = req.body.queryVector;
        const config = req.body.config;

        const pipeline = [
            {
                $vectorSearch: {
                    index: '',
                    path: `${req.schema.vectorField}`,
                    queryVector: queryVector,
                    numCandidates: config.k.val * config.overrequest_factor.val,
                    limit: config.k.val
                }
            },
            {
                $project: {
                    score: {$meta: "vectorSearchScore"},
                    title:`$${req.schema.titleField}`,
                    image:`$${req.schema.imageField}`,
                    description:`$${req.schema.descriptionField}`,
                    ...req.schema.searchFields.reduce((acc, f) => ({...acc, [f]: `$${f}`}), {})
                }
            }
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