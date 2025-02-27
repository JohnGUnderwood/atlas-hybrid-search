import { baseRouter } from "../../middleware/router";

const router = baseRouter.clone();
// Handle /api/model route
router.get(async (req, res) => {
    console.log(req);
    res.status(200).json({
        embedding:{
            provider:req.model?.provider,
            model: req.model?.model,
            dimensions: req.model?.dimensions
        },
        reranking:{
            provider: req.rerank_model?.provider,
            model: req.rerank_model?.rerank_model
        }
    });
});

export default router.handler();