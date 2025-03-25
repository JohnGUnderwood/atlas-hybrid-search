// /api/embed/model route
import { baseRouter } from "../../../middleware/router";

const router = baseRouter.clone();
router.get(async (req, res) => {
    res.status(200).json({
        provider: req.model.provider,
        model:req.model.model,
        dimensions: req.model.dimensions,
    });
});

export default router.handler();