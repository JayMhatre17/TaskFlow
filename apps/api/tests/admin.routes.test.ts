import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import { db } from "../src/prisma/db";
import { createUser } from "../src/service/auth.service";
import { createSession } from "../src/service/session.service";
import { createProject } from "../src/service/project.service";
import { createTask } from "../src/service/task.service";

const cleanupIds = new Set<number>();
const projectCleanupIds = new Set<number>();

afterEach(async () => {
  for (const projectId of projectCleanupIds) {
    await db.orm.public.Project.where({ id: projectId }).delete();
  }
  projectCleanupIds.clear();
  for (const userId of cleanupIds) {
    await db.orm.public.AccountActivity.where({ userId }).deleteAll();
    await db.orm.public.AccountActivity.where({ actorId: userId }).deleteAll();
    await db.orm.public.Session.where({ userId }).deleteAll();
    await db.orm.public.User.where({ id: userId }).delete();
  }
  cleanupIds.clear();
});

const createAccount = async (label: string, options: { master?: boolean; role?: "USER" | "ADMIN"; mustChangePassword?: boolean } = {}) => {
  const user = await createUser(
    `${label} User`,
    `${label.toLowerCase()}-${Date.now()}-${Math.random()}@example.com`,
    "password123",
  );
  cleanupIds.add(user.id);
  await db.orm.public.User.where({ id: user.id }).update({
    role: options.role ?? (options.master ? "ADMIN" : "USER"),
    isProtectedAdmin: options.master ?? false,
    mustChangePassword: options.mustChangePassword ?? false,
  });
  const session = await createSession(user.id);
  return { user, session };
};

describe("Master Admin user management", () => {
  it("requires an authenticated Master Admin for list and create routes", async () => {
    expect((await request(app).get("/api/admin/users")).status).toBe(401);
    expect((await request(app).post("/api/admin/users").send({})).status).toBe(401);

    const regular = await createAccount("regular-admin-test");
    const list = await request(app)
      .get("/api/admin/users")
      .set("Cookie", `taskflow_session=${regular.session.id}`);
    const create = await request(app)
      .post("/api/admin/users")
      .set("Cookie", `taskflow_session=${regular.session.id}`)
      .send({ name: "Blocked", email: "blocked@example.com", temporaryPassword: "temporary123" });

    expect(list.status).toBe(403);
    expect(create.status).toBe(403);

    const adminRoleWithoutProtection = await createAccount("unprotected-admin", { role: "ADMIN" });
    const unprotected = await request(app)
      .get("/api/admin/users")
      .set("Cookie", `taskflow_session=${adminRoleWithoutProtection.session.id}`);
    expect(unprotected.status).toBe(403);
  });

  it("lists only safe paginated fields and creates ordinary users requiring a password change", async () => {
    const master = await createAccount("master-admin", { master: true });
    const created = await request(app)
      .post("/api/admin/users")
      .set("Cookie", `taskflow_session=${master.session.id}`)
      .send({ name: "New Person", email: "new-person@example.com", temporaryPassword: "temp-password-123" });

    expect(created.status).toBe(201);
    expect(created.body.user).toMatchObject({
      name: "New Person",
      email: "new-person@example.com",
      role: "USER",
      status: "ACTIVE",
      mustChangePassword: true,
    });
    expect(created.body.user).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(created.body)).not.toContain("temp-password-123");

    const stored = await db.orm.public.User.where({ email: "new-person@example.com" }).first();
    expect(stored?.passwordHash).not.toBe("temp-password-123");
    expect(stored?.mustChangePassword).toBe(true);
    if (stored) cleanupIds.add(stored.id);

    const list = await request(app)
      .get("/api/admin/users?search=new-person&page=1&limit=5")
      .set("Cookie", `taskflow_session=${master.session.id}`);
    expect(list.status).toBe(200);
    expect(list.body.pagination).toMatchObject({ page: 1, limit: 5, total: 1, totalPages: 1 });
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]).toMatchObject({
      id: stored?.id,
      email: "new-person@example.com",
      mustChangePassword: true,
    });
    expect(list.body.data[0]).not.toHaveProperty("passwordHash");

    const currentMaster = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `taskflow_session=${master.session.id}`);
    expect(currentMaster.body.user).toMatchObject({ role: "ADMIN", isProtectedAdmin: true });

    const invalid = await request(app)
      .post("/api/admin/users")
      .set("Cookie", `taskflow_session=${master.session.id}`)
      .send({ name: "Invalid", email: "bad", temporaryPassword: "short" });
    expect(invalid.status).toBe(400);

    const duplicate = await request(app)
      .post("/api/admin/users")
      .set("Cookie", `taskflow_session=${master.session.id}`)
      .send({ name: "Duplicate", email: "new-person@example.com", temporaryPassword: "temporary123" });
    expect(duplicate.status).toBe(409);

    const stillProtected = await db.orm.public.User.where({ id: master.user.id }).first();
    expect(stillProtected).toMatchObject({ role: "ADMIN", isProtectedAdmin: true, status: "ACTIVE" });
  });

  it("deactivates and reactivates regular accounts without deleting data or restoring old sessions", async () => {
    const master = await createAccount("lifecycle-master", { master: true });
    const target = await createAccount("lifecycle-user", { mustChangePassword: true });
    const project = await createProject({
      name: "Retained project",
      description: "Preserved through account lifecycle changes",
      status: "Active",
      startDate: "2026-01-01",
      dueDate: "2026-12-31",
    }, target.user.id);
    projectCleanupIds.add(project.id);
    const task = await createTask({
      title: "Retained task",
      description: "Preserved through account lifecycle changes",
      status: "TODO",
      priority: "MEDIUM",
      projectId: project.id,
    }, target.user.id);

    const masterCookie = `taskflow_session=${master.session.id}`;
    const targetCookie = `taskflow_session=${target.session.id}`;
    const deactivated = await request(app)
      .patch(`/api/admin/users/${target.user.id}/deactivate`)
      .set("Cookie", masterCookie);

    expect(deactivated.status).toBe(200);
    expect(deactivated.body.user).toMatchObject({
      id: target.user.id,
      status: "DEACTIVATED",
      mustChangePassword: true,
    });
    expect(deactivated.body.user).not.toHaveProperty("passwordHash");
    expect(deactivated.body.user).not.toHaveProperty("deactivatedAt");
    expect(await db.orm.public.Session.where({ userId: target.user.id }).all()).toHaveLength(0);
    expect((await request(app).get("/api/auth/me").set("Cookie", targetCookie)).status).toBe(401);
    expect((await request(app).post("/api/auth/login").send({ email: target.user.email, password: "password123" })).status).toBe(401);
    expect((await request(app).get("/api/admin/users").set("Cookie", masterCookie)).status).toBe(200);

    const storedDeactivated = await db.orm.public.User.where({ id: target.user.id }).first();
    expect(storedDeactivated?.status).toBe("DEACTIVATED");
    expect(storedDeactivated?.deactivatedAt).not.toBeNull();
    expect(await db.orm.public.Project.where({ id: project.id }).first()).not.toBeNull();
    expect(await db.orm.public.Task.where({ id: task.id }).first()).not.toBeNull();

    const repeated = await request(app)
      .patch(`/api/admin/users/${target.user.id}/deactivate`)
      .set("Cookie", masterCookie);
    expect(repeated.status).toBe(200);
    expect(repeated.body.message).toMatch(/already deactivated/i);
    expect(await db.orm.public.AccountActivity.where({ userId: target.user.id, action: "DEACTIVATED" }).all()).toHaveLength(1);

    const reactivated = await request(app)
      .patch(`/api/admin/users/${target.user.id}/reactivate`)
      .set("Cookie", masterCookie);
    expect(reactivated.status).toBe(200);
    expect(reactivated.body.user).toMatchObject({ status: "ACTIVE", mustChangePassword: true });
    expect((await request(app).get("/api/auth/me").set("Cookie", targetCookie)).status).toBe(401);

    const freshLogin = await request(app).post("/api/auth/login").send({
      email: target.user.email,
      password: "password123",
    });
    expect(freshLogin.status).toBe(200);
    expect(freshLogin.body.user.mustChangePassword).toBe(true);
    const freshCookie = String(freshLogin.headers["set-cookie"]?.[0]).split(";")[0];
    expect((await request(app).get("/api/projects").set("Cookie", freshCookie)).status).toBe(403);

    const history = await db.orm.public.AccountActivity.where({ userId: target.user.id }).orderBy((entry) => entry.createdAt.asc()).all();
    expect(history.map((entry) => entry.action)).toEqual(["DEACTIVATED", "REACTIVATED"]);
    expect(history.every((entry) => entry.actorId === master.user.id)).toBe(true);
    expect(history.map((entry) => [entry.oldValue, entry.newValue])).toEqual([
      ["ACTIVE", "DEACTIVATED"],
      ["DEACTIVATED", "ACTIVE"],
    ]);
    const repeatedReactivation = await request(app)
      .patch(`/api/admin/users/${target.user.id}/reactivate`)
      .set("Cookie", masterCookie);
    expect(repeatedReactivation.status).toBe(200);
    expect(repeatedReactivation.body.message).toMatch(/already reactivated/i);
    expect(await db.orm.public.AccountActivity.where({ userId: target.user.id, action: "REACTIVATED" }).all()).toHaveLength(1);
  });

  it("rejects unauthorized, self, protected-admin, and invalid account changes", async () => {
    const master = await createAccount("lifecycle-guard-master", { master: true });
    const otherMaster = await createAccount("lifecycle-guard-other-master", { master: true });
    const unprotectedAdmin = await createAccount("lifecycle-guard-unprotected-admin", { role: "ADMIN" });
    const regular = await createAccount("lifecycle-guard-regular");
    const regularCookie = `taskflow_session=${regular.session.id}`;
    const masterCookie = `taskflow_session=${master.session.id}`;
    const unprotectedAdminCookie = `taskflow_session=${unprotectedAdmin.session.id}`;

    expect((await request(app).patch(`/api/admin/users/${otherMaster.user.id}/deactivate`)).status).toBe(401);
    expect((await request(app).patch(`/api/admin/users/${regular.user.id}/deactivate`).set("Cookie", regularCookie)).status).toBe(403);
    expect((await request(app).patch(`/api/admin/users/${regular.user.id}/deactivate`).set("Cookie", unprotectedAdminCookie)).status).toBe(403);
    expect((await request(app).patch(`/api/admin/users/${master.user.id}/deactivate`).set("Cookie", masterCookie)).status).toBe(403);
    expect((await request(app).patch(`/api/admin/users/${otherMaster.user.id}/deactivate`).set("Cookie", masterCookie)).status).toBe(403);
    expect((await request(app).patch("/api/admin/users/not-a-number/deactivate").set("Cookie", masterCookie)).status).toBe(400);
    expect((await request(app).patch("/api/admin/users/2147483647/deactivate").set("Cookie", masterCookie)).status).toBe(404);

    const unchanged = await db.orm.public.User.where({ id: regular.user.id }).first();
    expect(unchanged).toMatchObject({ status: "ACTIVE", deactivatedAt: null });
    expect(await db.orm.public.Session.where({ userId: regular.user.id }).all()).toHaveLength(1);
    expect(await db.orm.public.AccountActivity.where({ userId: regular.user.id }).all()).toHaveLength(0);
    expect((await request(app).get("/api/auth/me").set("Cookie", regularCookie)).status).toBe(200);
    expect((await db.orm.public.User.where({ id: master.user.id }).first())?.status).toBe("ACTIVE");
    expect((await db.orm.public.User.where({ id: otherMaster.user.id }).first())?.status).toBe("ACTIVE");
    expect((await db.orm.public.User.where({ id: unprotectedAdmin.user.id }).first())?.status).toBe("ACTIVE");
  });
});

describe("temporary password enforcement", () => {
  it("blocks app data until the temporary password is changed, then clears the requirement", async () => {
    const user = await createAccount("temporary-user", { mustChangePassword: true });
    const login = await request(app).post("/api/auth/login").send({
      email: user.user.email,
      password: "password123",
    });
    expect(login.status).toBe(200);
    expect(login.body.user.mustChangePassword).toBe(true);
    expect(login.body.user).not.toHaveProperty("passwordHash");

    const cookie = `taskflow_session=${user.session.id}`;
    const projects = await request(app).get("/api/projects").set("Cookie", cookie);
    const tasks = await request(app).get("/api/tasks").set("Cookie", cookie);
    const dashboard = await request(app).get("/api/dashboard/summary").set("Cookie", cookie);
    const notifications = await request(app).get("/api/notifications").set("Cookie", cookie);
    const profile = await request(app).patch("/api/auth/me").set("Cookie", cookie).send({ name: "Blocked edit" });
    expect(projects.status).toBe(403);
    expect(tasks.status).toBe(403);
    expect(dashboard.status).toBe(403);
    expect(notifications.status).toBe(403);
    expect(profile.status).toBe(403);

    const change = await request(app)
      .patch("/api/auth/password")
      .set("Cookie", cookie)
      .send({ currentPassword: "password123", newPassword: "first-login-new-password" });
    expect(change.status).toBe(200);
    expect(change.body).toEqual({ message: "Password updated successfully" });

    const currentUser = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(currentUser.status).toBe(200);
    expect(currentUser.body.user.mustChangePassword).toBe(false);
    expect((await request(app).get("/api/projects").set("Cookie", cookie)).status).toBe(200);

    const stored = await db.orm.public.User.where({ id: user.user.id }).first();
    expect(stored?.mustChangePassword).toBe(false);
    expect(stored?.passwordHash).not.toBe(user.user.passwordHash);
    expect((await request(app).post("/api/auth/login").send({ email: user.user.email, password: "password123" })).status).toBe(401);
    expect((await request(app).post("/api/auth/login").send({ email: user.user.email, password: "first-login-new-password" })).status).toBe(200);
  });
});
