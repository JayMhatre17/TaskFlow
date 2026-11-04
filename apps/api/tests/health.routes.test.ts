import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  rawSql: vi.fn(() => ({
    returnsRow: vi.fn(() => ({
      build: vi.fn(() => "readiness-plan"),
    })),
  })),
}));

vi.mock("../src/prisma/db.js", () => ({
  db: {
    raw: { sql: mocks.rawSql },
    runtime: () => ({ query: mocks.query }),
  },
}));

import app from "../src/app";

describe("GET /api/health/ready", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reports the database as connected when SELECT 1 returns the expected row", async () => {
    mocks.query.mockResolvedValue([{ ready: 1 }]);

    const response = await request(app).get("/api/health/ready");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      database: "connected",
    });
    expect(mocks.rawSql).toHaveBeenCalledOnce();
    expect(mocks.query).toHaveBeenCalledWith("readiness-plan");
  });

  it("reports the database as disconnected when the query fails", async () => {
    mocks.query.mockRejectedValue(new Error("sensitive database details"));

    const response = await request(app).get("/api/health/ready");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: "error",
      database: "disconnected",
    });
    expect(JSON.stringify(response.body)).not.toContain(
      "sensitive database details",
    );
  });

  it("reports the database as disconnected when the query result is unexpected", async () => {
    mocks.query.mockResolvedValue([{ ready: 0 }]);

    const response = await request(app).get("/api/health/ready");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: "error",
      database: "disconnected",
    });
  });
});
