import { Router } from "express";
import {
  getCurrentUserController,
  loginController,
} from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/require-auth.middleware";

const router = Router();

router.post("/login", loginController);
router.get("/me", requireAuth, getCurrentUserController);

export default router;
