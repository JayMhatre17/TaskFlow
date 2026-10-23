import { NextFunction, Request, Response } from "express";
import { getDashboardSummary } from "../service/dashboard.service";

export const getDashboardSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const summary = await getDashboardSummary(req.user!.id);
    return res.status(200).json(summary);
  } catch (error) {
    return next(error);
  }
};
