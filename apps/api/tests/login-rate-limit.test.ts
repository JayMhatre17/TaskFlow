import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import app from "../src/app";
import {
  createLoginRateLimit,
  loginRateLimit,
} from "../src/middlewares/login-rate-limit.middleware";
import { db } from "../src/prisma/db";
import { createUser } from "../src/service/auth.service";

const testIpKey = "127.0.0.1";

const createTestLoginApp = (respondWith: (successful: boolean) => number) => {
  const testApp = express();
  testApp.use(express.json());
  testApp.post("/login", createLoginRateLimit(), (req, res) => {
    return res.status(respondWith(req.body.successful === true)).json({
      message: "Test login response",
    });
  });
  return testApp;
};

describe("POST /api/auth/login rate limit", () => {
  afterEach(async () => {
    await loginRateLimit.resetKey(testIpKey);
    vi.restoreAllMocks();
  });

  it("processes ten failed attempts and rejects the eleventh with standard headers", async () => {
    const testApp = createTestLoginApp(() => 401);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await request(testApp).post("/login").send({
        successful: false,
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Test login response" });
    }

    const blockedResponse = await request(testApp)
      .post("/login")
      .send({ successful: false });

    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.body).toEqual({
      message: "Too many login attempts. Please try again later.",
    });
    expect(blockedResponse.headers["ratelimit-limit"]).toBeDefined();
    expect(blockedResponse.headers["ratelimit-remaining"]).toBeDefined();
    expect(blockedResponse.headers["ratelimit-reset"]).toBeDefined();
    expect(
      Object.keys(blockedResponse.headers).some((header) =>
        header.startsWith("x-ratelimit-"),
      ),
    ).toBe(false);
  });

  it("does not count successful logins against the failed-attempt quota", async () => {
    const user = await createUser(
      "Rate Limit Test User",
      `rate-limit-${Date.now()}-${Math.random()}@example.com`,
      "password123",
    );
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    try {
      const successfulResponse = await request(app)
        .post("/api/auth/login")
        .send({ email: user.email, password: "password123" });
      expect(successfulResponse.status).toBe(200);

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const response = await request(app).post("/api/auth/login").send({
          email: "rate-limit-unknown-user@example.com",
          password: "wrong-password",
        });
        expect(response.status).toBe(401);
      }

      const blockedResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: "rate-limit-unknown-user@example.com",
          password: "wrong-password",
        });
      expect(blockedResponse.status).toBe(429);
    } finally {
      await db.orm.public.Session.where({ userId: user.id }).delete();
      await db.orm.public.User.where({ id: user.id }).delete();
      logSpy.mockRestore();
    }
  });

  it("does not limit other authentication endpoints", async () => {
    // Exercise the production route mount: malformed login bodies return 400
    // before any database or password-hashing work, but still count as failures.
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await request(app).post("/api/auth/login").send({});
      expect(response.status).toBe(400);
    }

    const blockedLogin = await request(app).post("/api/auth/login").send({});
    expect(blockedLogin.status).toBe(429);

    for (let attempt = 0; attempt < 11; attempt += 1) {
      const response = await request(app).post("/api/auth/logout");
      expect(response.status).toBe(204);
    }
  });
});
