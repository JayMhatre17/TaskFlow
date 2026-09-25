import { NextFunction, Request, Response } from "express";
import {
  createProjectSchema,
  projectQuerySchema,
  UpdateProjectSchema,
} from "../schema/project.schema";
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjectOptions,
  getProjects,
  updateProject,
} from "../service/project.service";

export const getProjectsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = projectQuerySchema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const projects = await getProjects(result.data);

    return res.json(projects);
  } catch (error) {
    return next(error);
  }
};

export const createProjectController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = createProjectSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const project = await createProject(result.data);

    return res.status(201).json(project);
  } catch (error) {
    return next(error);
  }
};

export const getProjetByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    const project = await getProjectById(id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    return res.json(project);
  } catch (error) {
    return next(error);
  }
};

export const updateProjectController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    const result = UpdateProjectSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }
    const existingProject = await getProjectById(id);

    if (!existingProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }
    const project = await updateProject(id, result.data);

    return res.json(project);
  } catch (error) {
    return next(error);
  }
};

export const deleteProjectController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }
    const project = await getProjectById(id);
    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }
    await deleteProject(id);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const getProjectOptionsController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projects = await getProjectOptions();

    return res.json(projects);
  } catch (error) {
    return next(error);
  }
};
