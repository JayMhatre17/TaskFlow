import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../errors/api.error";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../service/notification.service";

const parsePositiveId = (value: string | string[]): number => {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ApiError(400, "Invalid notification ID");
  }

  return id;
};

export const getMyNotificationsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id;

    const notifications = await getMyNotifications(userId);

    return res.status(200).json({ notifications });
  } catch (error) {
    return next(error);
  }
};

export const getUnreadNotificationCountController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id;

    const notification = await getUnreadNotificationCount(userId);

    return res.status(200).json({ notification });
  } catch (error) {
    return next(error);
  }
};

export const markAllNotificationsAsReadController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id;

    const updatedCount = await markAllNotificationsAsRead(userId);

    return res.status(200).json({ updatedCount });
  } catch (error) {
    return next(error);
  }
};

export const markNotificationAsReadController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const notificationId = parsePositiveId(req.params.id);
    const userId = req.user!.id;

    const notification = await markNotificationAsRead(notificationId, userId);

    return res.status(200).json({ notification });
  } catch (error) {
    return next(error);
  }
};
