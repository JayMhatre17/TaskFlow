import { Router } from "express";
import { getDashboardSummaryController } from "../controllers/dashboard.controller";
import { requireAuth, requirePasswordChangeComplete } from "../middlewares/require-auth.middleware";

const router = Router();

router.use(requireAuth, requirePasswordChangeComplete);
router.get("/summary", getDashboardSummaryController);

export default router;
