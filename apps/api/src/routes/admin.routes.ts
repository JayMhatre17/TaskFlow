import { Router } from "express";
import {
  createManagedUserController,
  deactivateManagedUserController,
  listManagedUsersController,
  reactivateManagedUserController,
} from "../controllers/adminUser.controller";

const router = Router();

router.get("/users", listManagedUsersController);
router.post("/users", createManagedUserController);
router.patch("/users/:userId/deactivate", deactivateManagedUserController);
router.patch("/users/:userId/reactivate", reactivateManagedUserController);

export default router;
