import { apiRequest } from "./client";

export type NotificationType =
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

export type Notification = {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  taskId: number | null;
  projectId: number | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export const getNotifications = () =>
  apiRequest<{ notifications: Notification[] }>({
    method: "GET",
    path: "/api/notifications",
  });

export const getUnreadNotificationCount = () =>
  apiRequest<{ notification: number }>({
    method: "GET",
    path: "/api/notifications/unread-count",
  });

export const markNotificationAsRead = (id: number) =>
  apiRequest<{ notification: Notification }>({
    method: "PATCH",
    path: `/api/notifications/${id}/read`,
  });

export const markAllNotificationsAsRead = () =>
  apiRequest<{ updatedCount: number }>({
    method: "PATCH",
    path: "/api/notifications/read-all",
  });
