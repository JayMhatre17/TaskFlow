import { Router } from "express";
import { getDashboardSummaryController } from "../controllers/dashboard.controller.js";
import { requireAuth, requirePasswordChangeComplete } from "../middlewares/require-auth.middleware.js";

const router = Router();

router.use(requireAuth, requirePasswordChangeComplete);
router.get("/summary", getDashboardSummaryController);

export default router;
