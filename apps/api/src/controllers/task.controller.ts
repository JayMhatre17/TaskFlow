import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  getTasksByProjectId,
  updateTask,
} from "../service/task.service";
import {
  createTaskSchema,
  taskQuerySchema,
  updateTaskSchema,
} from "../schema/task.schema";

export const getTasksController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = taskQuerySchema.parse(req.query);
    const tasks = await getTasks(query);
    return res.status(200).json(tasks);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Invalid query parameters",
        errors: error.flatten().fieldErrors,
      });

      return;
    }
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch tasks",
    });
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
