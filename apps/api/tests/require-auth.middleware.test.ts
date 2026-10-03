import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { requireAuth } from "../src/middlewares/require-auth.middleware";
import { db } from "../src/prisma/db";
import { createUser } from "../src/service/auth.service";
import { createSession } from "../src/service/session.service";
import { errorMiddleware as errorHandler } from "../src/middlewares/error.middleware";
import { Temporal } from "@js-temporal/polyfill";

describe("requireAuth middleware", () => {
  let createdUserId: number | undefined;
  let createdSessionId: string | undefined;

  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  app.get("/protected", requireAuth, (req, res) => {
    res.status(200).json({
      user: req.user,
    });
  });

  app.use(errorHandler);

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
      "Middleware Test User",
      `middleware-${Date.now()}-${Math.random()}@example.com`,
      "password123",
    );

    createdUserId = user.id;

    const session = await createSession(user.id);
    createdSessionId = session.id;

    return { user, session };
  };

  it("should allow a request with a valid session", async () => {
    const { user, session } = await createAuthenticatedUser();

    const response = await request(app)
      .get("/protected")
      .set("Cookie", `taskflow_session=${session.id}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  });

  it("should reject a request without a session cookie", async () => {
    const response = await request(app).get("/protected");

    expect(response.status).toBe(401);
  });

  it("should reject an invalid session", async () => {
    const response = await request(app)
      .get("/protected")
      .set("Cookie", "taskflow_session=invalid-session");

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
      .get("/protected")
      .set("Cookie", `taskflow_session=${session.id}`);

    expect(response.status).toBe(401);
  });
});
