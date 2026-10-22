import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import {
  authenticatedRequestWithSession,
  createAuthenticatedAgent,
} from "./helpers/auth.helper";
import { createUser } from "../src/service/auth.service";
import { db } from "../src/prisma/db";

describe("/api/notifications routes", () => {
  let cleanupAuthenticatedAgent: (() => Promise<void>) | undefined;
  let otherUserId: number | undefined;

  afterEach(async () => {
    if (cleanupAuthenticatedAgent) {
      await cleanupAuthenticatedAgent();
      cleanupAuthenticatedAgent = undefined;
    }

    if (otherUserId !== undefined) {
      await db.orm.public.Notification.where({ userId: otherUserId }).deleteAll();
      await db.orm.public.Session.where({ userId: otherUserId }).deleteAll();
      await db.orm.public.User.where({ id: otherUserId }).delete();
      otherUserId = undefined;
    }
  });

  it("requires a session to access notifications", async () => {
    const response = await request(app).get("/api/notifications");

    expect(response.status).toBe(401);
  });

  it("lists, counts, and marks only the current user's notifications as read", async () => {
    const { session, user, cleanup } = await createAuthenticatedAgent();
    cleanupAuthenticatedAgent = cleanup;
    const authenticated = authenticatedRequestWithSession(session.id);
    const otherUser = await createUser(
      "Notification Route Other User",
      `notification-route-${Date.now()}-${Math.random()}@example.com`,
      "password123",
    );
    otherUserId = otherUser.id;

    const unread = await db.orm.public.Notification.create({
      userId: user.id,
      type: "TASK_ASSIGNED",
      title: "Route unread notification",
      message: "This belongs to the signed-in user",
    });
    const unreadForAll = await db.orm.public.Notification.create({
      userId: user.id,
      type: "TASK_COMMENTED",
      title: "Route second unread notification",
      message: "This is marked read with the bulk action",
    });
    const alreadyRead = await db.orm.public.Notification.create({
      userId: user.id,
      type: "TASK_STATUS_CHANGED",
      title: "Route read notification",
      message: "This notification has already been read",
      isRead: true,
      readAt: new Date().toISOString(),
    });
    const otherUnread = await db.orm.public.Notification.create({
      userId: otherUser.id,
      type: "TASK_ASSIGNED",
      title: "Other user's notification",
      message: "This must remain private",
    });

    const listResponse = await authenticated.get("/api/notifications");
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.notifications).toHaveLength(3);
    expect(listResponse.body.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: unread.id, isRead: false }),
        expect.objectContaining({ id: unreadForAll.id, isRead: false }),
        expect.objectContaining({ id: alreadyRead.id, isRead: true }),
      ]),
    );
    expect(
      listResponse.body.notifications.every(
        (notification: { userId: number }) => notification.userId === user.id,
      ),
    ).toBe(true);

    const countResponse = await authenticated.get(
      "/api/notifications/unread-count",
    );
    expect(countResponse.status).toBe(200);
    expect(countResponse.body).toEqual({ notification: 2 });

    const otherUserMarkResponse = await authenticated.patch(
      `/api/notifications/${otherUnread.id}/read`,
    );
    expect(otherUserMarkResponse.status).toBe(404);
    expect(otherUserMarkResponse.body).toEqual({
      message: "Notification not found",
    });

    const markResponse = await authenticated.patch(
      `/api/notifications/${unread.id}/read`,
    );
    expect(markResponse.status).toBe(200);
    expect(markResponse.body.notification).toMatchObject({
      id: unread.id,
      userId: user.id,
      isRead: true,
    });

    const markAllResponse = await authenticated.patch(
      "/api/notifications/read-all",
    );
    expect(markAllResponse.status).toBe(200);
    expect(markAllResponse.body).toEqual({ updatedCount: 1 });

    const markedAllNotification = await db.orm.public.Notification.where({
      id: unreadForAll.id,
    }).first();
    expect(markedAllNotification?.isRead).toBe(true);

    const otherUserNotification = await db.orm.public.Notification.where({
      id: otherUnread.id,
    }).first();
    expect(otherUserNotification?.isRead).toBe(false);
  });
});
