import { Router } from "express";
import {
  getCurrentUserController,
  changePasswordController,
  loginController,
  logoutController,
  updateCurrentUserController,
} from "../controllers/auth.controller.js";
import { requireAuth, requirePasswordChangeComplete } from "../middlewares/require-auth.middleware.js";
import { loginRateLimit } from "../middlewares/login-rate-limit.middleware.js";

const router = Router();

router.post("/login", loginRateLimit, loginController);
router.post("/logout", logoutController);
router.patch("/password", requireAuth, changePasswordController);
router.get("/me", requireAuth, getCurrentUserController);
router.patch("/me", requireAuth, requirePasswordChangeComplete, updateCurrentUserController);

export default router;
