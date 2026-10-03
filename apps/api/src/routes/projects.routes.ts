import { Router } from "express";
import {
  createProjectController,
  deleteProjectController,
  getProjectOptionsController,
  getProjectsController,
  getProjetByIdController,
  updateProjectController,
} from "../controllers/projects.controller";
import { getTasksByProjectController } from "../controllers/task.controller";
import { requireAuth } from "../middlewares/require-auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", getProjectsController);

router.post("/", createProjectController);

router.get("/options", getProjectOptionsController);

router.get("/:id", getProjetByIdController);

router.patch("/:id", updateProjectController);

router.delete("/:id", deleteProjectController);

router.get("/:projectId/tasks", getTasksByProjectController);

export default router;
