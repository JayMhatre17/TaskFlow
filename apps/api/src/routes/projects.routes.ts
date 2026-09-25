import { Router } from "express";
import { createProject, getProjects } from "../service/project.service";
import { createProjectSchema } from "../schema/project.schema";
import {
  createProjectController,
  deleteProjectController,
  getProjectOptionsController,
  getProjectsController,
  getProjetByIdController,
  updateProjectController,
} from "../controllers/projects.controller";
import { getTasksByProjectController } from "../controllers/task.controller";

const router = Router();

router.get("/", getProjectsController);

router.post("/", createProjectController);

router.get("/options", getProjectOptionsController);

router.get("/:id", getProjetByIdController);

router.patch("/:id", updateProjectController);

router.delete("/:id", deleteProjectController);

router.get("/:projectId/tasks", getTasksByProjectController);

export default router;
