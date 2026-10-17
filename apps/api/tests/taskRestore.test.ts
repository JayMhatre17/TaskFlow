import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import { db } from "../src/prisma/db";
import { createUser } from "../src/service/auth.service";
import { createSession } from "../src/service/session.service";
import { authenticatedRequestWithSession } from "./helpers/auth.helper";
import { Temporal } from "@js-temporal/polyfill";

const userIds: number[] = [];
const sessionIds: string[] = [];
const projectIds: number[] = [];
const taskIds: number[] = [];

const createTestUser = async (name: string, email: string) => {
  const user = await createUser(name, email, "TestPassword123!");
  userIds.push(user.id);

  const session = await createSession(user.id);
  sessionIds.push(session.id);

  return {
    user,
    api: authenticatedRequestWithSession(session.id),
  };
};

const createTestProject = async (ownerId: number) => {
  const project = await db.orm.public.Project.create({
    name: `Restore Test Project ${Date.now()}`,
    description: "Task restoration test",
    status: "Active",
    startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
    dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
    ownerId,
  });

  projectIds.push(project.id);
  return project;
};

const createTestTask = async (projectId: number, creatorId: number) => {
  const task = await db.orm.public.Task.create({
    title: "Task to restore",
    description: "Testing restoration",
    status: 1,
    priority: 2,
    projectId,
    creatorId,
  });

  taskIds.push(task.id);
  return task;
};

const softDeleteTask = async (taskId: number, userId: number) => {
  await db.orm.public.Task.where({ id: taskId }).update({
    deletedAt: Temporal.Now.instant().toString(),
    deletedById: userId,
  });
};

describe("Task restoration API", () => {
  let owner: Awaited<ReturnType<typeof createTestUser>>;
  let outsider: Awaited<ReturnType<typeof createTestUser>>;
  let project: Awaited<ReturnType<typeof createTestProject>>;
  let task: Awaited<ReturnType<typeof createTestTask>>;

  beforeAll(async () => {
    owner = await createTestUser(
      "Restore Owner",
      `restore-owner-${Date.now()}@example.com`,
    );

    outsider = await createTestUser(
      "Restore Outsider",
      `restore-outsider-${Date.now()}@example.com`,
    );

    project = await createTestProject(owner.user.id);
    task = await createTestTask(project.id, owner.user.id);
  });

  afterAll(async () => {
    // Remove dependent records before their parent records.
    for (const taskId of taskIds) {
      await db.orm.public.TaskActivity.where({ taskId }).deleteAll();
      await db.orm.public.TaskComment.where({ taskId }).deleteAll();
      await db.orm.public.TaskAssignmentHistory.where({ taskId }).deleteAll();
    }

    for (const taskId of taskIds) {
      await db.orm.public.Task.where({ id: taskId }).deleteAll();
    }

    for (const projectId of projectIds) {
      await db.orm.public.ProjectMember.where({ projectId }).deleteAll();
    }

    for (const projectId of projectIds) {
      await db.orm.public.Project.where({ id: projectId }).deleteAll();
    }

    for (const userId of userIds) {
      await db.orm.public.Session.where({ userId }).deleteAll();
    }

    for (const userId of userIds) {
      await db.orm.public.User.where({ id: userId }).deleteAll();
    }
  });

  it("restores a deleted task and records activity", async () => {
    await softDeleteTask(task.id, owner.user.id);

    const response = await owner.api.patch(`/api/tasks/${task.id}/restore`);

    expect(response.status).toBe(200);

    const restored = await db.orm.public.Task.where({
      id: task.id,
    }).first();

    expect(restored?.deletedAt).toBeNull();
    expect(restored?.deletedById).toBeNull();
    expect(restored?.scheduledDeletionAt).toBeNull();

    const activity = await db.orm.public.TaskActivity.where({
      taskId: task.id,
      action: "RESTORED",
      actorId: owner.user.id,
    }).first();

    expect(activity).not.toBeNull();
  });

  it("returns 404 when restoring an active task", async () => {
    const response = await owner.api.patch(`/api/tasks/${task.id}/restore`);

    expect(response.status).toBe(404);
  });

  it("returns 404 when a non-owner tries to restore a task", async () => {
    await softDeleteTask(task.id, owner.user.id);

    const response = await outsider.api.patch(`/api/tasks/${task.id}/restore`);

    expect(response.status).toBe(404);
  });

  it("returns 400 for an invalid task ID", async () => {
    const response = await owner.api.patch("/api/tasks/invalid/restore");

    expect(response.status).toBe(400);
  });

  it("returns 401 without authentication", async () => {
    const response = await request(app).patch(`/api/tasks/${task.id}/restore`);

    expect(response.status).toBe(401);
  });
});
