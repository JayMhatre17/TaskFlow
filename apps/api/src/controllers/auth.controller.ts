import { NextFunction, Request, Response } from "express";
import {
  changePasswordSchema,
  loginSchema,
  updateProfileSchema,
} from "../schema/auth.schema";
import { changePassword, login, updateProfile } from "../service/auth.service";
import {
  createSession,
  deleteSession,
  getSessionById,
  isSessionExpired,
} from "../service/session.service";
import { ApiError } from "../errors/api.error";
import { db } from "../prisma/db";

const SESSION_COOKIE_NAME = "taskflow_session";

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const input = loginSchema.parse(req.body);

    const user = await login(input.email, input.password);

    const session = await createSession(user.id);

    res.cookie(SESSION_COOKIE_NAME, session.id, getCookieOptions());

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isProtectedAdmin: user.isProtectedAdmin,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUserController = (req: Request, res: Response) => {
  res.status(200).json({
    user: req.user!,
  });
};

export const updateCurrentUserController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const input = updateProfileSchema.parse(req.body);
    const user = await updateProfile(req.user!.id, input.name);
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
};

export const changePasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const input = changePasswordSchema.parse(req.body);
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
    if (!sessionId) {
      throw new ApiError(401, "Authentication required");
    }

    await changePassword(
      req.user!.id,
      sessionId,
      input.currentPassword,
      input.newPassword,
    );
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return next(error);
  }
};

export const logoutController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sessionId = req.cookies?.taskflow_session;
    if (sessionId) {
      await deleteSession(sessionId);
    }

    res.clearCookie("taskflow_session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
