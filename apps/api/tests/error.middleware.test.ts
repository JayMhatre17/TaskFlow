import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError } from "../src/errors/api.error";
import { errorMiddleware } from "../src/middlewares/error.middleware";

const createErrorTestApp = () => {
  const app = express();

  app.get("/unexpected", (_req, _res, next) => {
    next(new Error("database password and SQL details"));
  });
  app.get("/forbidden", (_req, _res, next) => {
    next(new ApiError(403, "Forbidden"));
  });
  app.get("/unauthorized", (_req, _res, next) => {
    next(new ApiError(401, "Authentication required"));
  });
  app.get("/not-found", (_req, _res, next) => {
    next(new ApiError(404, "Project not found"));
  });
  app.get("/validation", (_req, _res, next) => {
    try {
      z.object({ name: z.string() }).parse({ name: 123 });
    } catch (error) {
      next(error);
    }
  });
  app.use(errorMiddleware);

  return app;
};

describe("error middleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("hides unexpected error details and preserves the generic response shape", async () => {
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await request(createErrorTestApp()).get("/unexpected");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "Internal Server Error",
      error: "An unexpected error occurred",
    });
    expect(JSON.stringify(response.body)).not.toContain("database password");
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "database password and SQL details" }),
    );
  });

  it.each([
    [401, "Authentication required", "/unauthorized"],
    [403, "Forbidden", "/forbidden"],
    [404, "Project not found", "/not-found"],
  ])("preserves intentional %i application error responses", async (status, message, path) => {
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await request(createErrorTestApp()).get(path);

    expect(response.status).toBe(status);
    expect(response.body).toEqual({ message });
    expect(logError).not.toHaveBeenCalled();
  });

  it("preserves the validation error response structure", async () => {
    const response = await request(createErrorTestApp()).get("/validation");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.errors).toEqual(expect.any(Array));
  });
});
