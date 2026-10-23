import { Router } from "express";
import {
  assignTaskController,
  createTaskController,
  deleteTaskController,
  getTaskActivitiesController,
  getTaskByIdController,
  getTasksController,
  getDeletedTasksController,
  restoreTaskController,
  updateTaskController,
} from "../controllers/task.controller";
import { requireAuth } from "../middlewares/require-auth.middleware";
import {
  createTaskCommentController,
  deleteTaskCommentController,
  getTaskCommentsController,
  updateTaskCommentController,
} from "../controllers/taskComment.controller";

const router = Router();

router.use(requireAuth);

router.get("/", getTasksController);
router.get("/deleted", getDeletedTasksController);

router.post("/", createTaskController);

router.patch("/:taskId/assignment", assignTaskController);

router.get("/:taskId/comments", getTaskCommentsController);

router.post("/:taskId/comments", createTaskCommentController);

router.patch("/:taskId/comments/:commentId", updateTaskCommentController);

router.delete("/:taskId/comments/:commentId", deleteTaskCommentController);

router.get("/:id", getTaskByIdController);

router.patch("/:id", updateTaskController);

router.delete("/:id", deleteTaskController);

router.patch("/:id/restore", restoreTaskController);

router.get("/:id/activities", getTaskActivitiesController);

export default router;
