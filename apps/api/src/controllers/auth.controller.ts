import { NextFunction, Request, Response } from "express";
import { loginSchema } from "../schema/auth.schema";
import { login } from "../service/auth.service";
import {
  createSession,
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
