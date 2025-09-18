// Get documents from MongoDB collection
import { ObjectId } from 'mongodb';
import { baseRouter } from "../../middleware/router";

const router = baseRouter.clone();
router.post(async (req, res) => {
    try{
        let filter = {};
        let projection = {};
        if(req.body.ids){
            try{
                filter = {"_id": {$in: req.body.ids.map(id => {
                    //if id is not a valid ObjectId convert from string
                    if(!ObjectId.isValid(id)){
                        return id
                    }else if (typeof id == 'string'){
                        return ObjectId.createFromHexString(id);
                    }else{
                        throw `id ${id} is not a valid ObjectId or string`
                    }
                })}};

                if(req.body.projection){
                    projection = req.body.projection;
                }

            }catch(error){
                console.log(`Error parsing id: ${error}`);
                res.status(400).send(`Error parsing id: ${error}`);
                return;
            }
        }else{
            console.log(`Request missing 'ids' data`);
            res.status(400).send(`Request missing 'ids' data`);
            return;
        }
        const response = await req.collection.find(filter, { projection }).toArray();
        res.status(200).json(response);
    }catch(error){
        res.status(405).json({'error':`${error}`});
    }
});

export default router.handler();