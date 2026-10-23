import { Router } from "express";
import { getDashboardSummaryController } from "../controllers/dashboard.controller";
import { requireAuth } from "../middlewares/require-auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/summary", getDashboardSummaryController);

export default router;
