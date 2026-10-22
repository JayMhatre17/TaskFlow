import { describe, expect, it } from "vitest";
import { assertTestDatabaseConfiguration } from "./test-database-guard";

describe("test database guard", () => {
  const validEnv = {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://localhost:5432/taskflow_test",
  };

  it("accepts a PostgreSQL URL for taskflow_test", () => {
    expect(() => assertTestDatabaseConfiguration(validEnv)).not.toThrow();
  });

  it("rejects environments outside test mode", () => {
    expect(() =>
      assertTestDatabaseConfiguration({ ...validEnv, NODE_ENV: "development" }),
    ).toThrow('NODE_ENV="test"');
  });

  it("rejects a missing database URL", () => {
    expect(() =>
      assertTestDatabaseConfiguration({ NODE_ENV: "test" }),
    ).toThrow("DATABASE_URL is required");
  });

  it("rejects malformed URLs without echoing the value", () => {
    const secret = "private-test-password";
    let thrown: unknown;
    try {
      assertTestDatabaseConfiguration({
        NODE_ENV: "test",
        DATABASE_URL: secret,
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toContain("DATABASE_URL is malformed");
    expect((thrown as Error).message).not.toContain(secret);
  });

  it("rejects any database other than taskflow_test", () => {
    expect(() =>
      assertTestDatabaseConfiguration({
        ...validEnv,
        DATABASE_URL:
          "postgresql://localhost:5432/taskflow",
      }),
    ).toThrow('must target the "taskflow_test" database');
  });
});
