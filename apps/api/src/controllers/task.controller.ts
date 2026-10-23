import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  assignTask,
  createTask,
  deleteTask,
  getTaskActivities,
  getTaskById,
  getDeletedTasks,
  getTasks,
  getTasksByProjectId,
  restoreTask,
  updateTask,
} from "../service/task.service";
import {
  assignTaskSchema,
  createTaskSchema,
  taskQuerySchema,
  updateTaskSchema,
} from "../schema/task.schema";
import { ApiError } from "../errors/api.error";
import { parsePositiveId } from "./taskComment.controller";

export const getDeletedTasksController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tasks = await getDeletedTasks(req.user!.id);
    return res.status(200).json({ tasks });
  } catch (error) {
    return next(error);
  }
};

export const getTasksController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = taskQuerySchema.parse(req.query);
    const tasks = await getTasks(query, req.user!.id);
    return res.status(200).json(tasks);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid query parameters",
        errors: error.flatten().fieldErrors,
      });
    }

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
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid task id",
      });
    }
    const task = await getTaskById(id, req.user!.id);

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

    const task = await createTask(parsed.data, req.user!.id);

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
    if (!Number.isSafeInteger(id) || id <= 0) {
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
    const existingTask = await getTaskById(id, req.user!.id);
    if (!existingTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const task = await updateTask(id, parsed.data, req.user!.id);

    if (!task) {
      throw new ApiError(404, "Task not found");
    }
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
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid task id",
      });
    }
    const task = await getTaskById(id, req.user!.id);
    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }
    const deleted = await deleteTask(id, req.user!.id);
    if (!deleted) {
      return res.status(404).json({
        message: "Task not found",
      });
    }
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

    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
      throw new ApiError(400, "Invalid project ID");
    }

    const tasks = await getTasksByProjectId(projectId, req.user!.id);

    if (tasks === null) {
      throw new ApiError(404, "Project not found");
    }

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

export const assignTaskController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const taskId = Number(req.params.taskId);

    if (!Number.isSafeInteger(taskId) || taskId <= 0) {
      throw new ApiError(400, "Invalid task ID");
    }

    const data = assignTaskSchema.safeParse(req.body);

    if (!data.success) {
      throw new ApiError(400, "Invalid request");
    }

    const task = await assignTask(taskId, data.data, req.user!.id);

    return res.status(200).json({ task });
  } catch (error) {
    return next(error);
  }
};

export const restoreTaskController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parsePositiveId(req.params.id, "task ID");

    const userId = req.user!.id;

    const restored = await restoreTask(id, userId);

    if (!restored) {
      throw new ApiError(404, "Task not found");
    }

    return res.status(200).json({ message: "Task restored Successfully" });
  } catch (error) {
    return next(error);
  }
};

export const getTaskActivitiesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parsePositiveId(req.params.id, "task ID");

    const userId = req.user!.id;

    const activities = await getTaskActivities(id, userId);

    return res.status(200).json({ activities });
  } catch (error) {
    return next(error);
  }
};
