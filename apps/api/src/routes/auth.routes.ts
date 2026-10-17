import { Router } from "express";
import {
  getCurrentUserController,
  loginController,
  logoutController,
} from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/require-auth.middleware";

const router = Router();

router.post("/login", loginController);
router.post("/logout", logoutController);
router.get("/me", requireAuth, getCurrentUserController);

export default router;
