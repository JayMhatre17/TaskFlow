import { Router } from "express";
import {
  createTaskController,
  deleteTaskController,
  getTaskByIdController,
  getTasksController,
  updateTaskController,
} from "../controllers/task.controller";

const router = Router();

router.get("/", getTasksController);

router.get("/:id", getTaskByIdController);

router.post("/", createTaskController);

router.patch("/:id", updateTaskController);

router.delete("/:id", deleteTaskController);

export default router;

