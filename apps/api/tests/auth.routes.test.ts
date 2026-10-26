import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";

import app from "../src/app";
import { db } from "../src/prisma/db";
import { createUser } from "../src/service/auth.service";
import { createSession } from "../src/service/session.service";
import { Temporal } from "@js-temporal/polyfill";

describe("POST /api/auth/login", () => {
  let createdUserId: number | undefined;

  afterEach(async () => {
    if (createdUserId !== undefined) {
      await db.orm.public.User.where({ id: createdUserId }).delete();

      createdUserId = undefined;
    }
  });

  const createTestUser = async () => {
    const user = await createUser(
      "Login Test User",
      `login-test-${Date.now()}-${Math.random()}@example.com`,
      "password123",
    );

    createdUserId = user.id;

    return user;
  };

  it("should log in with valid credentials and set a secure HttpOnly cookie", async () => {
    const user = await createTestUser();

    const response = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: "password123",
    });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: "USER",
        isProtectedAdmin: false,
        mustChangePassword: false,
      },
    });

    expect(response.body.user).not.toHaveProperty("passwordHash");

    const cookies = response.headers["set-cookie"];

    expect(cookies).toBeDefined();

    const sessionCookie = (Array.isArray(cookies) ? cookies : [cookies]).find(
      (cookie) => cookie?.startsWith("taskflow_session="),
    );

    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toContain("HttpOnly");
    expect(sessionCookie).toContain("SameSite=Lax");
    expect(sessionCookie).toContain("Path=/");
    expect(sessionCookie).not.toContain("Secure");
  });

  it("should reject invalid credentials", async () => {
    const user = await createTestUser();

    const response = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: "wrong-password",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");
    expect(response.headers["set-cookie"]).toBeUndefined();
  });

  it.each(["DEACTIVATED", "PENDING_DELETION"] as const)(
    "should reject login for a %s account",
    async (status) => {
      const user = await createTestUser();
      await db.orm.public.User.where({ id: user.id }).update({ status });

      const response = await request(app).post("/api/auth/login").send({
        email: user.email,
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid email or password");
      expect(response.headers["set-cookie"]).toBeUndefined();
    },
  );

  it("should reject an unknown email", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "unknown@example.com",
      password: "password123",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");
    expect(response.headers["set-cookie"]).toBeUndefined();
  });

  it("should reject invalid request data", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "not-an-email",
      password: "",
    });

    expect(response.status).toBe(400);
    expect(response.headers["set-cookie"]).toBeUndefined();
  });
});

describe("GET /api/auth/me", () => {
  let createdUserId: number | undefined;
  let createdSessionId: string | undefined;

  afterEach(async () => {
    if (createdSessionId !== undefined) {
      await db.orm.public.Session.where({ id: createdSessionId }).delete();

      createdSessionId = undefined;
    }

    if (createdUserId !== undefined) {
      await db.orm.public.User.where({ id: createdUserId }).delete();

      createdUserId = undefined;
    }
  });

  const createAuthenticatedUser = async () => {
    const user = await createUser(
      "Current User Test",
      `me-test-${Date.now()}-${Math.random()}@example.com`,
      "password123",
    );

    createdUserId = user.id;

    const session = await createSession(user.id);
    createdSessionId = session.id;

    return { user, session };
  };

  it("should return the current user for a valid session", async () => {
    const { user, session } = await createAuthenticatedUser();

    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `taskflow_session=${session.id}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: "USER",
        isProtectedAdmin: false,
        mustChangePassword: false,
      },
    });

    expect(response.body.user).not.toHaveProperty("passwordHash");
  });

  it("should reject a request without a session cookie", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
  });

  it("should reject an invalid session ID", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", "taskflow_session=invalid-session-id");

    expect(response.status).toBe(401);
  });

  it("should reject an expired session", async () => {
    const { session } = await createAuthenticatedUser();

    await db.orm.public.Session.where({ id: session.id }).update({
      expiresAt: Temporal.Now.instant().subtract({
        seconds: 60,
      }),
    });

    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `taskflow_session=${session.id}`);

    expect(response.status).toBe(401);
  });
});

describe("PATCH /api/auth/me", () => {
  let createdUserId: number | undefined;
  let createdSessionId: string | undefined;

  afterEach(async () => {
    if (createdSessionId !== undefined) {
      await db.orm.public.Session.where({ id: createdSessionId }).delete();
      createdSessionId = undefined;
    }
    if (createdUserId !== undefined) {
      await db.orm.public.User.where({ id: createdUserId }).delete();
      createdUserId = undefined;
    }
  });

  const createAuthenticatedUser = async () => {
    const user = await createUser(
      "Profile Settings Test",
      `profile-test-${Date.now()}-${Math.random()}@example.com`,
      "password123",
    );
    createdUserId = user.id;
    const session = await createSession(user.id);
    createdSessionId = session.id;
    return { user, session };
  };

  it("updates only the current user's name and returns safe user fields", async () => {
    const { user, session } = await createAuthenticatedUser();

    const response = await request(app)
      .patch("/api/auth/me")
      .set("Cookie", `taskflow_session=${session.id}`)
      .send({ name: "  Updated Name  ", email: "changed@example.com" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: {
        id: user.id,
        name: "Updated Name",
        email: user.email,
        role: "USER",
        isProtectedAdmin: false,
        mustChangePassword: false,
      },
    });
    expect(response.body.user).not.toHaveProperty("passwordHash");
    expect(response.body.user).not.toHaveProperty("status");

    const storedUser = await db.orm.public.User.where({ id: user.id }).first();
    expect(storedUser?.name).toBe("Updated Name");
    expect(storedUser?.email).toBe(user.email);
  });

  it("requires authentication and validates the profile name", async () => {
    const unauthenticated = await request(app)
      .patch("/api/auth/me")
      .send({ name: "Updated Name" });
    expect(unauthenticated.status).toBe(401);

    const { session } = await createAuthenticatedUser();
    const invalid = await request(app)
      .patch("/api/auth/me")
      .set("Cookie", `taskflow_session=${session.id}`)
      .send({ name: "   " });

    expect(invalid.status).toBe(400);
    expect(invalid.body.message).toBe("Validation failed");
  });
});

describe("PATCH /api/auth/password", () => {
  let createdUserId: number | undefined;

  afterEach(async () => {
    if (createdUserId !== undefined) {
      await db.orm.public.Session.where({ userId: createdUserId }).deleteAll();
      await db.orm.public.User.where({ id: createdUserId }).delete();
      createdUserId = undefined;
    }
  });

  const createAuthenticatedUser = async () => {
    const user = await createUser(
      "Password Change Test",
      `password-change-${Date.now()}-${Math.random()}@example.com`,
      "password123",
    );
    createdUserId = user.id;
    const currentSession = await createSession(user.id);
    const otherSession = await createSession(user.id);
    return { user, currentSession, otherSession };
  };

  it("changes the password, keeps the current session, and revokes other sessions", async () => {
    const { user, currentSession, otherSession } = await createAuthenticatedUser();

    const response = await request(app)
      .patch("/api/auth/password")
      .set("Cookie", `taskflow_session=${currentSession.id}`)
      .send({ currentPassword: "password123", newPassword: "new-password-456" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Password updated successfully" });
    expect(JSON.stringify(response.body)).not.toContain("password");
    expect(response.headers["set-cookie"]).toBeUndefined();

    const updatedUser = await db.orm.public.User.where({ id: user.id }).first();
    expect(updatedUser?.passwordHash).not.toBe(user.passwordHash);

    const currentSessionCheck = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `taskflow_session=${currentSession.id}`);
    expect(currentSessionCheck.status).toBe(200);

    const otherSessionCheck = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `taskflow_session=${otherSession.id}`);
    expect(otherSessionCheck.status).toBe(401);

    const oldPasswordLogin = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: "password123",
    });
    expect(oldPasswordLogin.status).toBe(401);

    const newPasswordLogin = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: "new-password-456",
    });
    expect(newPasswordLogin.status).toBe(200);
    expect(newPasswordLogin.body.user).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      role: "USER",
      isProtectedAdmin: false,
      mustChangePassword: false,
    });
    expect(newPasswordLogin.body.user).not.toHaveProperty("passwordHash");
  });

  it("rejects an incorrect current password without changing the hash", async () => {
    const { user, currentSession } = await createAuthenticatedUser();

    const response = await request(app)
      .patch("/api/auth/password")
      .set("Cookie", `taskflow_session=${currentSession.id}`)
      .send({ currentPassword: "wrong-password", newPassword: "new-password-456" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Current password is incorrect");
    const storedUser = await db.orm.public.User.where({ id: user.id }).first();
    expect(storedUser?.passwordHash).toBe(user.passwordHash);
    expect(await db.orm.public.Session.where({ userId: user.id }).all()).toHaveLength(2);
  });

  it("rejects an invalid new password", async () => {
    const { user, currentSession } = await createAuthenticatedUser();

    const response = await request(app)
      .patch("/api/auth/password")
      .set("Cookie", `taskflow_session=${currentSession.id}`)
      .send({ currentPassword: "password123", newPassword: "short" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
    const storedUser = await db.orm.public.User.where({ id: user.id }).first();
    expect(storedUser?.passwordHash).toBe(user.passwordHash);
  });

  it("rejects a new password that matches the current password", async () => {
    const { user, currentSession } = await createAuthenticatedUser();

    const response = await request(app)
      .patch("/api/auth/password")
      .set("Cookie", `taskflow_session=${currentSession.id}`)
      .send({ currentPassword: "password123", newPassword: "password123" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "New password must be different from current password",
    );
    const storedUser = await db.orm.public.User.where({ id: user.id }).first();
    expect(storedUser?.passwordHash).toBe(user.passwordHash);
  });

  it("requires authentication", async () => {
    const response = await request(app)
      .patch("/api/auth/password")
      .send({ currentPassword: "password123", newPassword: "new-password-456" });

    expect(response.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  let createdUserId: number | undefined;

  afterEach(async () => {
    if (createdUserId !== undefined) {
      await db.orm.public.Session.where({ userId: createdUserId }).deleteAll();
      await db.orm.public.User.where({ id: createdUserId }).delete();
      createdUserId = undefined;
    }
  });

  it("continues to clear and revoke the current session", async () => {
    const user = await createUser(
      "Logout Test User",
      `logout-test-${Date.now()}-${Math.random()}@example.com`,
      "password123",
    );
    createdUserId = user.id;
    const session = await createSession(user.id);

    const response = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", `taskflow_session=${session.id}`);

    expect(response.status).toBe(204);
    expect(response.headers["set-cookie"]?.[0]).toContain("taskflow_session=");

    const currentUser = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `taskflow_session=${session.id}`);
    expect(currentUser.status).toBe(401);
  });
});
