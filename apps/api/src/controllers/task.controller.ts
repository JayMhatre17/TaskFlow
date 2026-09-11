import { NextFunction, Request, Response } from "express";
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  getTasksByProjectId,
  updateTask,
} from "../service/task.service";
import { createTaskSchema, updateTaskSchema } from "../schema/task.schema";

export const getTasksController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tasks = await getTasks();
    return res.json(tasks);
  } catch (error) {
    return next(error);
  }
};

export const getTaskByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid task id",
      });
    }
    const task = await getTaskById(id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.json(task);
  } catch (error) {
    return next(error);
  }
};

export const createTaskController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const task = await createTask(parsed.data);

    return res.status(201).json(task);
  } catch (error) {
    return next(error);
  }
};

export const updateTaskController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid task id",
      });
    }
    const parsed = updateTaskSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const existingTask = await getTaskById(id);
    if (!existingTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const task = await updateTask(id, parsed.data);

    return res.json(task);
  } catch (error) {
    return next(error);
  }
};

export const deleteTaskController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid task id",
      });
    }
    const task = await getTaskById(id);
    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }
    await deleteTask(id);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const getTasksByProjectController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = Number(req.params.projectId);

    if (!Number.isInteger(projectId)) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    const tasks = await getTasksByProjectId(projectId);

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};
