import { Router } from "express";
import {
  getCurrentUserController,
  changePasswordController,
  loginController,
  logoutController,
  updateCurrentUserController,
} from "../controllers/auth.controller";
import { requireAuth, requirePasswordChangeComplete } from "../middlewares/require-auth.middleware";

const router = Router();

router.post("/login", loginController);
router.post("/logout", logoutController);
router.patch("/password", requireAuth, changePasswordController);
router.get("/me", requireAuth, getCurrentUserController);
router.patch("/me", requireAuth, requirePasswordChangeComplete, updateCurrentUserController);

export default router;
