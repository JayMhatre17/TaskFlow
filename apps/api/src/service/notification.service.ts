import { Temporal } from "@js-temporal/polyfill";
import { ApiError } from "../errors/api.error";
import { db } from "../prisma/db";

type CreateNotificationInput = {
  userId: number;
  type:
    | "TASK_ASSIGNED"
    | "TASK_REASSIGNED"
    | "TASK_UNASSIGNED"
    | "TASK_STATUS_CHANGED"
    | "TASK_COMMENTED"
    | "PROJECT_INVITATION"
    | "PROJECT_MEMBER_ADDED"
    | "PROJECT_MEMBER_REMOVED"
    | "PROJECT_OWNERSHIP_TRANSFERRED"
    | "ACCOUNT_DEACTIVATED"
    | "ACCOUNT_DELETION"
    | "PROJECT_INVITATION_ACCEPTED";
  title: string;
  message: string;
  taskId?: number | null;
  projectId?: number | null;
};

export const createNotification = async (data: CreateNotificationInput) => {
  const user = await db.orm.public.User.where({ id: data.userId }).first();

  if (!user) {
    throw new ApiError(404, "Notification recipient not found");
  }

  if (data.taskId != null) {
    const task = await db.orm.public.Task.where({ id: data.taskId }).first();

    if (!task) {
      throw new ApiError(404, "Notification task not found");
    }
  }

  if (data.projectId != null) {
    const project = await db.orm.public.Project.where({
      id: data.projectId,
    }).first();
    if (!project) {
      throw new ApiError(404, "Notification project not found");
    }
  }

  return db.orm.public.Notification.create({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    taskId: data.taskId ?? null,
    projectId: data.projectId ?? null,
  });
};

export const getMyNotifications = async (userId: number) => {
  const notifications = await db.orm.public.Notification.where({
    userId,
  }).all();

  return notifications.sort((a, b) =>
    Temporal.Instant.compare(
      Temporal.Instant.from(b.createdAt),
      Temporal.Instant.from(a.createdAt),
    ),
  );
};

export const getUnreadNotificationCount = async (userId: number) => {
  const notifications = await db.orm.public.Notification.where({
    userId,
    isRead: false,
  }).all();

  return notifications.length;
};

export const markNotificationAsRead = async (
  notificationId: number,
  userId: number,
) => {
  const notification = await db.orm.public.Notification.where({
    id: notificationId,
    userId,
  }).first();

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  if (notification.isRead) {
    return notification;
  }

  const updatedNotification = await db.orm.public.Notification.where({
    id: notificationId,
    userId,
    isRead: false,
  }).update({
    isRead: true,
    readAt: Temporal.Now.instant().toString(),
  });

  if (!updatedNotification) {
    return db.orm.public.Notification.where({
      id: notificationId,
      userId,
    }).first();
  }

  return updatedNotification;
};

export const markAllNotificationsAsRead = async (userId: number) => {
  const notifications = await db.orm.public.Notification.where({
    userId,
    isRead: false,
  }).all();

  const readAt = Temporal.Now.instant().toString();

  for (const notification of notifications) {
    await db.orm.public.Notification.where({
      id: notification.id,
      userId,
      isRead: false,
    }).update({
      isRead: true,
      readAt,
    });
  }

  return notifications.length;
};

export const createNotificationWithClient = async (
  tx: any,
  data: CreateNotificationInput,
) => {
  const user = await tx.orm.public.User.where({
    id: data.userId,
  }).first();

  if (!user) {
    throw new ApiError(404, "Notification recipient not found");
  }

  if (data.taskId != null) {
    const task = await tx.orm.public.Task.where({
      id: data.taskId,
    }).first();

    if (!task) {
      throw new ApiError(404, "Notification task not found");
    }
  }

  if (data.projectId != null) {
    const project = await tx.orm.public.Project.where({
      id: data.projectId,
    }).first();

    if (!project) {
      throw new ApiError(404, "Notification project not found");
    }
  }

  return tx.orm.public.Notification.create({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    taskId: data.taskId ?? null,
    projectId: data.projectId ?? null,
  });
};
