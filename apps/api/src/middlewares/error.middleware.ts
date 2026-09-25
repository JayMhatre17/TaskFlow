import { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/api.error";

export const errorMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error(error);

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
