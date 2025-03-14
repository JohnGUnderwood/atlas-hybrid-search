// /api/rerank/model route
import { baseRouter } from "../../../middleware/router";

const router = baseRouter.clone();
router.get(async (req, res) => {
    res.status(200).json({
        provider: req.rerank_model?.provider,
        model: req.rerank_model?.rerank_model,
    });
});

export default router.handler();