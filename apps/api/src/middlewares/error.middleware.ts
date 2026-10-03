import { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/api.error";
import { ZodError } from "zod";

export const errorMiddleware = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error(error);
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      errors: error.issues,
    });
    return;
  }
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      message: error.message,
    });
    return;
  }

  res.status(500).json({
    message: "Internal Server Error",
    error: error instanceof Error ? error.message : error,
  });
};
