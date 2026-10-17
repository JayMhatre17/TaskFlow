import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import { db } from "../src/prisma/db";
import { createUser } from "../src/service/auth.service";
import {
  createNotification,
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../src/service/notification.service";

const userIds: number[] = [];

describe("Notification Service", () => {
  let ownerId: number;
  let otherUserId: number;

  beforeAll(async () => {
    const owner = await createUser(
      "Notification Owner",
      `notification-owner-${Date.now()}@example.com`,
      "TestPassword123!",
    );

    const otherUser = await createUser(
      "Notification Other User",
      `notification-other-${Date.now()}@example.com`,
      "TestPassword123!",
    );

    ownerId = owner.id;
    otherUserId = otherUser.id;

    userIds.push(ownerId, otherUserId);
  });

  afterAll(async () => {
    // Remove notifications before deleting their recipient users.
    for (const userId of userIds) {
      await db.orm.public.Notification.where({
        userId,
      }).deleteAll();
    }

    for (const userId of userIds) {
      await db.orm.public.Session.where({
        userId,
      }).deleteAll();
    }

    for (const userId of userIds) {
      await db.orm.public.User.where({
        id: userId,
      }).deleteAll();
    }
  });

  const createTestNotification = async (
    userId: number,
    overrides: {
      type?: "TASK_ASSIGNED" | "TASK_STATUS_CHANGED";
      title?: string;
      message?: string;
      isRead?: boolean;
      readAt?: string | null;
      createdAt?: string;
    } = {},
  ) => {
    return db.orm.public.Notification.create({
      userId,
      type: overrides.type ?? "TASK_ASSIGNED",
      title: overrides.title ?? "Task assigned",
      message: overrides.message ?? "A task was assigned to you",
      isRead: overrides.isRead ?? false,
      readAt: overrides.readAt ?? null,
      ...(overrides.createdAt !== undefined && {
        createdAt: overrides.createdAt,
      }),
    });
  };

  it("creates a notification for the specified recipient", async () => {
    const notification = await createNotification({
      userId: ownerId,
      type: "TASK_ASSIGNED",
      title: "New task assigned",
      message: "You have been assigned a task",
    });

    expect(notification.userId).toBe(ownerId);
    expect(notification.type).toBe("TASK_ASSIGNED");
    expect(notification.title).toBe("New task assigned");
    expect(notification.message).toBe("You have been assigned a task");
    expect(notification.isRead).toBe(false);
    expect(notification.readAt).toBeNull();
  });

  it("rejects notification creation for a nonexistent recipient", async () => {
    await expect(
      createNotification({
        userId: 2_000_000_000,
        type: "TASK_ASSIGNED",
        title: "Invalid recipient",
        message: "This should not be created",
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("rejects notification creation for a nonexistent task", async () => {
    await expect(
      createNotification({
        userId: ownerId,
        type: "TASK_ASSIGNED",
        title: "Invalid task",
        message: "The referenced task does not exist",
        taskId: 2_000_000_000,
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("rejects notification creation for a nonexistent project", async () => {
    await expect(
      createNotification({
        userId: ownerId,
        type: "PROJECT_MEMBER_ADDED",
        title: "Invalid project",
        message: "The referenced project does not exist",
        projectId: 2_000_000_000,
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("returns only notifications belonging to the requested user", async () => {
    await createTestNotification(ownerId, {
      title: "Owner notification",
    });

    await createTestNotification(otherUserId, {
      title: "Other user notification",
    });

    const notifications = await getMyNotifications(ownerId);

    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications.every((item) => item.userId === ownerId)).toBe(true);

    expect(
      notifications.some((item) => item.title === "Other user notification"),
    ).toBe(false);
  });

  it("returns notifications newest first", async () => {
    await createTestNotification(ownerId, {
      title: "Older notification",
      createdAt: Temporal.Instant.from("2026-01-01T10:00:00Z").toString(),
    });

    await createTestNotification(ownerId, {
      title: "Newer notification",
      createdAt: Temporal.Instant.from("2026-01-02T10:00:00Z").toString(),
    });

    const notifications = await getMyNotifications(ownerId);

    const olderIndex = notifications.findIndex(
      (item) => item.title === "Older notification",
    );

    const newerIndex = notifications.findIndex(
      (item) => item.title === "Newer notification",
    );

    expect(olderIndex).toBeGreaterThanOrEqual(0);
    expect(newerIndex).toBeGreaterThanOrEqual(0);
    expect(newerIndex).toBeLessThan(olderIndex);
  });

  it("returns zero when the user has no notifications", async () => {
    const count = await getUnreadNotificationCount(2_000_000_000);

    expect(count).toBe(0);
  });

  it("counts only unread notifications belonging to the user", async () => {
    await createTestNotification(ownerId, {
      title: "Unread one",
      isRead: false,
    });

    await createTestNotification(ownerId, {
      title: "Unread two",
      isRead: false,
    });

    await createTestNotification(ownerId, {
      title: "Already read",
      isRead: true,
      readAt: Temporal.Instant.from("2026-01-01T10:00:00Z").toString(),
    });

    await createTestNotification(otherUserId, {
      title: "Other user's unread",
      isRead: false,
    });

    const count = await getUnreadNotificationCount(ownerId);

    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("marks a notification as read and sets readAt", async () => {
    const notification = await createTestNotification(ownerId);

    const updated = await markNotificationAsRead(notification.id, ownerId);

    expect(updated?.isRead).toBe(true);
    expect(updated?.readAt).not.toBeNull();

    const saved = await db.orm.public.Notification.where({
      id: notification.id,
      userId: ownerId,
    }).first();

    expect(saved?.isRead).toBe(true);
    expect(saved?.readAt).not.toBeNull();
  });

  it("does not reset readAt for an already-read notification", async () => {
    const originalReadAt = Temporal.Instant.from(
      "2026-02-01T10:00:00Z",
    ).toString();

    const notification = await createTestNotification(ownerId, {
      isRead: true,
      readAt: originalReadAt,
    });

    const updated = await markNotificationAsRead(notification.id, ownerId);

    expect(updated?.isRead).toBe(true);
    expect(
      Temporal.Instant.compare(
        Temporal.Instant.from(updated!.readAt!),
        Temporal.Instant.from(originalReadAt),
      ),
    ).toBe(0);
  });

  it("returns 404 when marking another user's notification as read", async () => {
    const notification = await createTestNotification(otherUserId);

    await expect(
      markNotificationAsRead(notification.id, ownerId),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("returns 404 when marking a nonexistent notification as read", async () => {
    await expect(
      markNotificationAsRead(2_000_000_000, ownerId),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("marks all of the user's unread notifications as read", async () => {
    const first = await createTestNotification(ownerId, {
      title: "Bulk unread one",
      isRead: false,
    });

    const second = await createTestNotification(ownerId, {
      title: "Bulk unread two",
      isRead: false,
    });

    const alreadyRead = await createTestNotification(ownerId, {
      title: "Bulk already read",
      isRead: true,
      readAt: Temporal.Instant.from("2026-01-01T10:00:00Z").toString(),
    });

    const otherUserNotification = await createTestNotification(otherUserId, {
      title: "Other user's bulk unread",
      isRead: false,
    });

    const updatedCount = await markAllNotificationsAsRead(ownerId);

    expect(updatedCount).toBeGreaterThanOrEqual(2);

    const updatedFirst = await db.orm.public.Notification.where({
      id: first.id,
    }).first();

    const updatedSecond = await db.orm.public.Notification.where({
      id: second.id,
    }).first();

    const unchanged = await db.orm.public.Notification.where({
      id: alreadyRead.id,
    }).first();

    const otherUserUnchanged = await db.orm.public.Notification.where({
      id: otherUserNotification.id,
    }).first();

    expect(updatedFirst?.isRead).toBe(true);
    expect(updatedFirst?.readAt).not.toBeNull();

    expect(updatedSecond?.isRead).toBe(true);
    expect(updatedSecond?.readAt).not.toBeNull();

    expect(unchanged?.isRead).toBe(true);
    expect(
      Temporal.Instant.compare(
        Temporal.Instant.from(unchanged!.readAt!),
        Temporal.Instant.from("2026-01-01T10:00:00Z"),
      ),
    ).toBe(0);

    expect(otherUserUnchanged?.isRead).toBe(false);
    expect(otherUserUnchanged?.readAt).toBeNull();
  });

  it("returns zero when marking all notifications read and none are unread", async () => {
    const first = await createTestNotification(ownerId, {
      title: "Already read one",
      isRead: true,
      readAt: Temporal.Instant.from("2026-01-01T10:00:00Z").toString(),
    });

    const second = await createTestNotification(ownerId, {
      title: "Already read two",
      isRead: true,
      readAt: Temporal.Instant.from("2026-01-02T10:00:00Z").toString(),
    });

    const updatedCount = await markAllNotificationsAsRead(ownerId);

    expect(updatedCount).toBe(0);

    const savedFirst = await db.orm.public.Notification.where({
      id: first.id,
    }).first();

    const savedSecond = await db.orm.public.Notification.where({
      id: second.id,
    }).first();

    expect(savedFirst?.isRead).toBe(true);
    expect(savedSecond?.isRead).toBe(true);
  });
});
