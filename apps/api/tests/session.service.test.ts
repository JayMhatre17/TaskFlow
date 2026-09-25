import { afterEach, describe, expect, it } from "vitest";
import { db } from "../src/prisma/db";
import { createUser } from "../src/service/auth.service";
import { createSession } from "../src/service/session.service";

describe("session service", () => {
  let createdUserId: number | undefined;
  let createdSessionId: string | undefined;

  afterEach(async () => {
    if (createdSessionId !== undefined) {
      await db.orm.public.Session.where({
        id: createdSessionId,
      }).delete();

      createdSessionId = undefined;
    }

    if (createdUserId !== undefined) {
      await db.orm.public.User.where({
        id: createdUserId,
      }).delete();

      createdUserId = undefined;
    }
  });

  it("should create a session for a user", async () => {
    const email = `session-test-${Date.now()}@example.com`;

    const user = await createUser("Session Test User", email, "password123");

    createdUserId = user.id;

    const session = await createSession(user.id);

    createdSessionId = session.id;

    expect(session.id).toBeTruthy();
    expect(session.userId).toBe(user.id);
    expect(session.expiresAt).toBeInstanceOf(Date);
  });

  it("should create a session with an expiry approximately 7 days from now", async () => {
    const email = `session-expiry-${Date.now()}@example.com`;

    const user = await createUser("Session Expiry User", email, "password123");

    createdUserId = user.id;

    const before = Date.now();

    const session = await createSession(user.id);

    const after = Date.now();

    createdSessionId = session.id;

    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    expect(session.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + sevenDays,
    );

    expect(session.expiresAt.getTime()).toBeLessThanOrEqual(after + sevenDays);
  });

  it("should generate a unique session id", async () => {
    const email = `session-id-${Date.now()}@example.com`;

    const user = await createUser("Session ID User", email, "password123");

    createdUserId = user.id;

    const session = await createSession(user.id);

    createdSessionId = session.id;

    expect(session.id).toHaveLength(64);
  });
});
