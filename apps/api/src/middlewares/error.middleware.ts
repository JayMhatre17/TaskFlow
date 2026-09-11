import { NextFunction, Request, Response } from "express";

export const errorMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error(error);
  res.status(500).json({
    message: "Internal Server Error",
    error: error instanceof Error ? error.message : error,
  });
};
