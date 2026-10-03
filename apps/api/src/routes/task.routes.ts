import { Router } from "express";
import {
  createTaskController,
  deleteTaskController,
  getTaskByIdController,
  getTasksController,
  updateTaskController,
} from "../controllers/task.controller";
import { requireAuth } from "../middlewares/require-auth.middleware";

const router = Router();

router.use(requireAuth)

router.get("/", getTasksController);

router.get("/:id", getTaskByIdController);

router.post("/", createTaskController);

router.patch("/:id", updateTaskController);

router.delete("/:id", deleteTaskController);

export default router;

