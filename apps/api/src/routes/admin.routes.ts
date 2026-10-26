import { Router } from "express";
import {
  createManagedUserController,
  deactivateManagedUserController,
  forceManagedUserPasswordChangeController,
  listManagedUsersController,
  reactivateManagedUserController,
  resetManagedUserPasswordController,
} from "../controllers/adminUser.controller.js";

const router = Router();

router.get("/users", listManagedUsersController);
router.post("/users", createManagedUserController);
router.patch("/users/:userId/deactivate", deactivateManagedUserController);
router.patch("/users/:userId/reactivate", reactivateManagedUserController);
router.post("/users/:userId/reset-password", resetManagedUserPasswordController);
router.post("/users/:userId/force-password-change", forceManagedUserPasswordChangeController);

export default router;
