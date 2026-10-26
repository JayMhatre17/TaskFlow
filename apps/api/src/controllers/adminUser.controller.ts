import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/api.error.js";
import { adminUserQuerySchema, createAdminUserSchema } from "../schema/auth.schema.js";
import {
  changeManagedUserStatus,
  createManagedUser,
  forceManagedUserPasswordChange,
  listManagedUsers,
  resetManagedUserPassword,
} from "../service/adminUser.service.js";

export const listManagedUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = adminUserQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
    }
    return res.status(200).json(await listManagedUsers(parsed.data));
  } catch (error) {
    return next(error);
  }
};

export const createManagedUserController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = createAdminUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
    }
    const user = await createManagedUser(parsed.data);
    return res.status(201).json({ message: "User created", user });
  } catch (error) {
    return next(error);
  }
};

const changeUserStatusController = (status: "ACTIVE" | "DEACTIVATED") =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.params.userId);
      if (!Number.isSafeInteger(userId) || userId <= 0) {
        throw new ApiError(400, "Invalid user ID");
      }
      const result = await changeManagedUserStatus(userId, req.user!.id, status);
      const label = status === "DEACTIVATED" ? "deactivated" : "reactivated";
      const message = result.changed
        ? `User ${label} successfully`
        : `User is already ${label}`;
      return res.status(200).json({ message, user: result.user });
    } catch (error) {
      return next(error);
    }
  };

export const deactivateManagedUserController = changeUserStatusController("DEACTIVATED");
export const reactivateManagedUserController = changeUserStatusController("ACTIVE");

const getTargetUserId = (req: Request) => {
  const userId = Number(req.params.userId);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new ApiError(400, "Invalid user ID");
  }
  return userId;
};

export const resetManagedUserPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await resetManagedUserPassword(getTargetUserId(req), req.user!.id);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      message: "Password reset successfully. Share the temporary password securely.",
      temporaryPassword: result.temporaryPassword,
      user: result.user,
    });
  } catch (error) {
    return next(error);
  }
};

export const forceManagedUserPasswordChangeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await forceManagedUserPasswordChange(getTargetUserId(req), req.user!.id);
    return res.status(200).json({
      message: "Password change required at next login",
      user,
    });
  } catch (error) {
    return next(error);
  }
};
