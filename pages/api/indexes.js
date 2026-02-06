// /api/indexes route

import { baseRouter } from "../../middleware/router";

const router = baseRouter.clone();
router.get(async (req, res) => {
    res.status(200).json(req.searchIndex);
});

export default router.handler();