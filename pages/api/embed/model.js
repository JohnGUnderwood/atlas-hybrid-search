import { baseRouter } from '../../../middleware/router';

const router = baseRouter.clone();
// Handle /api/embed/model route
router.get(async (req, res) => {
    console.log(`Request for model ${req.model.name}`);
    res.status(200).json({ name: req.model.name, dimensions: req.model.dimensions });
});

export default router.handler();