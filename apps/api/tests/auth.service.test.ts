import { afterEach, describe, expect, it } from "vitest";
import { db } from "../src/prisma/db";
import { createUser, getUserByEmail, login } from "../src/service/auth.service";

describe("auth service", () => {
  let createdUserId: number | undefined;

  afterEach(async () => {
    if (createdUserId !== undefined) {
      await db.orm.public.User.where({
        id: createdUserId,
      }).delete();

      createdUserId = undefined;
    }
  });

  it("should return null when user does not exist", async () => {
    const user = await getUserByEmail(`nonexistent-${Date.now()}@example.com`);

    expect(user).toBeNull();
  });

  it("should create a user with a hashed password", async () => {
    const email = `test-user-${Date.now()}@example.com`;

    const user = await createUser("Test User", email, "password123");

    createdUserId = user.id;

    expect(user.email).toBe(email);
    expect(user.name).toBe("Test User");
    expect(user.passwordHash).not.toBe("password123");
  });

  it("should login with valid credentials", async () => {
    const email = `login-test-${Date.now()}@example.com`;
    const password = "password123";

    const user = await createUser("Login Test User", email, password);

    createdUserId = user.id;

    const loggedInUser = await login(email, password);

    expect(loggedInUser.id).toBe(user.id);
    expect(loggedInUser.email).toBe(email);
    expect(loggedInUser.name).toBe("Login Test User");
  });

  it("should reject an unknown email", async () => {
    const email = `unknown-${Date.now()}@example.com`;

    await expect(login(email, "password123")).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid email or password",
    });
  });

  it("should reject an incorrect password", async () => {
    const email = `wrong-password-${Date.now()}@example.com`;

    const user = await createUser(
      "Wrong Password User",
      email,
      "correct-password",
    );

    createdUserId = user.id;

    await expect(login(email, "wrong-password")).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid email or password",
    });
  });
});
