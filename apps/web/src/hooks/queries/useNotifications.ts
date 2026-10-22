import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/api/notification.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const notificationQueryKeys = {
  all: ["notifications"] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};

export const useNotifications = (enabled = true) =>
  useQuery({
    queryKey: notificationQueryKeys.all,
    queryFn: getNotifications,
    enabled,
  });

export const useUnreadNotificationCount = () =>
  useQuery({
    queryKey: notificationQueryKeys.unreadCount,
    queryFn: getUnreadNotificationCount,
    refetchInterval: 30_000,
  });

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: notificationQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: notificationQueryKeys.unreadCount,
        }),
      ]);
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: notificationQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: notificationQueryKeys.unreadCount,
        }),
      ]);
    },
  });
};
