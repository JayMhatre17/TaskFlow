import { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/api.error.js";
import { getSessionById, isSessionExpired } from "../service/session.service.js";
import { db } from "../prisma/db.js";

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

     if (!user || user.status !== "ACTIVE") {
       throw new ApiError(401, "Invalid or expired session");
     }

     req.user = {
       id: user.id,
       name: user.name,
       email: user.email,
       role: user.role,
       isProtectedAdmin: user.isProtectedAdmin,
       mustChangePassword: user.mustChangePassword,
     }; 

     next();
  } catch (error) {
    next(error);
  }
};

export const requirePasswordChangeComplete = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (req.user?.mustChangePassword) {
    next(new ApiError(403, "You must change your temporary password first"));
    return;
  }
  next();
};

export const requireMasterAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (
    req.user?.role !== "ADMIN" ||
    !req.user.isProtectedAdmin ||
    req.user.mustChangePassword
  ) {
    next(new ApiError(403, "Master administrator access required"));
    return;
  }
  next();
};
