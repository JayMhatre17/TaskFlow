"use client";

import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../ui/Popover";
import { Bell, Check } from "lucide-react";
import { Button } from "../ui/button";
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/queries/useNotifications";

const NotificationPopover = () => {
  const [open, setOpen] = useState(false);
  const notificationsQuery = useNotifications(open);
  const unreadCountQuery = useUnreadNotificationCount();
  const markRead = useMarkNotificationAsRead();
  const markAllRead = useMarkAllNotificationsAsRead();
  const unreadCount = unreadCountQuery.data?.notification ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative cursor-pointer"
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
          />
        }
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <PopoverHeader>
          <div className="flex items-center justify-between gap-2">
            <PopoverTitle>Notifications</PopoverTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-xs"
                disabled={markAllRead.isPending}
                onClick={() => markAllRead.mutate()}
              >
                Mark all as read
              </Button>
            )}
          </div>
        </PopoverHeader>
        {markRead.isError || markAllRead.isError ? (
          <p role="alert" className="text-sm text-red-600">
            Unable to update notifications. Please try again.
          </p>
        ) : null}
        {unreadCountQuery.isError || notificationsQuery.isError ? (
          <p role="alert" className="py-4 text-center text-sm text-red-600">
            Unable to load notifications. Please try again.
          </p>
        ) : notificationsQuery.isLoading ? (
          <p className="py-6 text-center text-sm text-gray-500" role="status">
            Loading notifications…
          </p>
        ) : notificationsQuery.data?.notifications.length ? (
          <ul className="max-h-96 divide-y overflow-y-auto">
            {notificationsQuery.data.notifications.map((notification) => (
              <li
                key={notification.id}
                className={`flex items-start gap-3 py-3 ${notification.isRead ? "" : "bg-blue-50/60"}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {notification.message}
                  </p>
                </div>
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Mark ${notification.title} as read`}
                    title="Mark as read"
                    disabled={markRead.isPending}
                    onClick={() => markRead.mutate(notification.id)}
                  >
                    <Check size={16} />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-gray-500">
            No notifications
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPopover;
