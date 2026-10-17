import { NextFunction, Request, Response } from "express";
import {
  addProjectMember,
  getProjectMembers,
  removeProjectMember,
} from "../service/projectMember.service";
import { addProjectMemberSchema } from "../schema/projectMember.schema";

export const getProjectMembersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    const members = await getProjectMembers(projectId, req.user!.id);

    if (!members) {
      return res.status(404).json({
        message: "Project not found",
      });
    }
    return res.json(members);
  } catch (error) {
    return next(error);
  }
};

export const addProjectMemberController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = Number(req.params.projectId);

    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    const result = addProjectMemberSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const member = await addProjectMember(
      projectId,
      result.data.userId,
      req.user!.id,
    );
    return res.status(201).json(member);
  } catch (error) {
    return next(error);
  }
};

export const removeProjectMemberController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = Number(req.params.projectId);
    const userId = Number(req.params.userId);
    if (
      !Number.isSafeInteger(projectId) ||
      projectId <= 0 ||
      !Number.isSafeInteger(userId) ||
      userId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid project or user ID",
      });
    }

    await removeProjectMember(projectId, userId, req.user!.id);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
