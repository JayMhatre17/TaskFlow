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
