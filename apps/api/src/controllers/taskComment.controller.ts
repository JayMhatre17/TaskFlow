import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../errors/api.error";
import {
  createTaskCommentSchema,
  updateTaskCommentSchema,
} from "../schema/taskComment.schema";
import {
  createTaskComment,
  deleteTaskComment,
  getTaskComments,
  updateTaskComment,
} from "../service/taskComment.service";

export const parsePositiveId = (value: string | string[], label: string): number => {
  if (typeof value !== "string") {
    throw new ApiError(400, `Invalid ${label}`);
  }

  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ApiError(400, `Invalid ${label}`);
  }

  return id;
};
export const getTaskCommentsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const taskId = parsePositiveId(req.params.taskId, "task ID");

    const comments = await getTaskComments(taskId, req.user!.id);

    return res.status(200).json({ comments });
  } catch (error) {
    next(error);
  }
};

export const createTaskCommentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const taskId = parsePositiveId(req.params.taskId, "task ID");
    const data = createTaskCommentSchema.parse(req.body);

    const comment = await createTaskComment(taskId, data, req.user!.id);

    return res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
};

export const updateTaskCommentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const commentId = parsePositiveId(req.params.commentId, "comment ID");

    const data = updateTaskCommentSchema.parse(req.body);

    const comment = await updateTaskComment(commentId, data, req.user!.id);

    return res.status(200).json({ comment });
  } catch (error) {
    next(error);
  }
};

export const deleteTaskCommentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const commentId = parsePositiveId(req.params.commentId, "comment ID");

    await deleteTaskComment(commentId, req.user!.id);

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};
