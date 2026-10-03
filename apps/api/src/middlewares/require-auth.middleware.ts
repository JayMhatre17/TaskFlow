import { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/api.error";
import { getSessionById, isSessionExpired } from "../service/session.service";
import { db } from "../prisma/db";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sessionId = req.cookies?.taskflow_session;
    if (!sessionId) {
      throw new ApiError(401, "Authentication required");
    }

    const session = await getSessionById(sessionId);

    if (!session || isSessionExpired(session.expiresAt)) {
      throw new ApiError(401, "Invalid or expired session");
    }

    const user = await db.orm.public.User.where({ id: session.userId }).first();

     if (!user) {
       throw new ApiError(401, "Invalid or expired session");
     }

     req.user = {
       id: user.id,
       name: user.name,
       email: user.email,
     }; 

     next();
  } catch (error) {
    next(error);
  }
};
