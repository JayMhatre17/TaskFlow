import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { Temporal } from "@js-temporal/polyfill";
import app from "../src/app";
import { db } from "../src/prisma/db";
import { createUser } from "../src/service/auth.service";
import { createSession } from "../src/service/session.service";
import { authenticatedRequestWithSession } from "./helpers/auth.helper";

const userIds: number[] = [];
const projectIds: number[] = [];
const taskIds: number[] = [];

describe("Task Activity API", () => {
  let ownerId: number;
  let memberId: number;
  let outsiderId: number;
  let taskId: number;

  let ownerApi: ReturnType<typeof authenticatedRequestWithSession>;
  let memberApi: ReturnType<typeof authenticatedRequestWithSession>;
  let outsiderApi: ReturnType<typeof authenticatedRequestWithSession>;

  beforeAll(async () => {
    // Create users
    const owner = await createUser(
      "Activity API Owner",
      `activity-api-owner-${Date.now()}@example.com`,
      "TestPassword123!",
    );

    const member = await createUser(
      "Activity API Member",
      `activity-api-member-${Date.now()}@example.com`,
      "TestPassword123!",
    );

    const outsider = await createUser(
      "Activity API Outsider",
      `activity-api-outsider-${Date.now()}@example.com`,
      "TestPassword123!",
    );

    ownerId = owner.id;
    memberId = member.id;
    outsiderId = outsider.id;

    userIds.push(ownerId, memberId, outsiderId);

    // Create authenticated sessions
    const ownerSession = await createSession(ownerId);
    const memberSession = await createSession(memberId);
    const outsiderSession = await createSession(outsiderId);

    ownerApi = authenticatedRequestWithSession(ownerSession.id);
    memberApi = authenticatedRequestWithSession(memberSession.id);
    outsiderApi = authenticatedRequestWithSession(outsiderSession.id);

    // Create project
    const project = await db.orm.public.Project.create({
      name: `Task Activity API Project ${Date.now()}`,
      description: "Project for task activity API tests",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId,
    });

    projectIds.push(project.id);

    // Add an active project member
    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: memberId,
      addedById: ownerId,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });

    // Create task
    const task = await db.orm.public.Task.create({
      title: "Task Activity API Test",
      description: "Testing activity retrieval through the API",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: ownerId,
    });

    taskId = task.id;
    taskIds.push(taskId);

    // Seed activities with different timestamps
    await db.orm.public.TaskActivity.create({
      taskId,
      actorId: ownerId,
      action: "CREATED",
      description: "Created task",
      createdAt: Temporal.Instant.from("2026-01-01T10:00:00Z").toString(),
    });

    await db.orm.public.TaskActivity.create({
      taskId,
      actorId: ownerId,
      action: "STATUS_CHANGED",
      field: "status",
      oldValue: "Todo",
      newValue: "In Progress",
      description: "Changed status",
      createdAt: Temporal.Instant.from("2026-01-02T10:00:00Z").toString(),
    });
  });

  afterAll(async () => {
    // Remove dependent records first
    for (const id of taskIds) {
      await db.orm.public.TaskActivity.where({
        taskId: id,
      }).deleteAll();

      await db.orm.public.TaskComment.where({
        taskId: id,
      }).deleteAll();

      await db.orm.public.TaskAssignmentHistory.where({
        taskId: id,
      }).deleteAll();
    }

    for (const id of taskIds) {
      await db.orm.public.Task.where({ id }).deleteAll();
    }

    for (const id of projectIds) {
      await db.orm.public.ProjectMember.where({
        projectId: id,
      }).deleteAll();
    }

    for (const id of projectIds) {
      await db.orm.public.Project.where({ id }).deleteAll();
    }

    for (const id of userIds) {
      await db.orm.public.Session.where({
        userId: id,
      }).deleteAll();
    }

    for (const id of userIds) {
      await db.orm.public.User.where({ id }).deleteAll();
    }
  });

  it("allows the project owner to retrieve task activities", async () => {
    const response = await ownerApi.get(`/api/tasks/${taskId}/activities`);

    expect(response.status).toBe(200);
    expect(response.body.activities).toHaveLength(2);

    expect(
      response.body.activities.map(
        (activity: { action: string }) => activity.action,
      ),
    ).toContain("CREATED");

    expect(
      response.body.activities.map(
        (activity: { action: string }) => activity.action,
      ),
    ).toContain("STATUS_CHANGED");
  });

  it("allows an active project member to retrieve task activities", async () => {
    const response = await memberApi.get(`/api/tasks/${taskId}/activities`);

    expect(response.status).toBe(200);
    expect(response.body.activities).toHaveLength(2);
  });

  it("denies a non-member access to task activities", async () => {
    const response = await outsiderApi.get(`/api/tasks/${taskId}/activities`);

    expect(response.status).toBe(404);
  });

  it("returns activities newest first", async () => {
    const response = await ownerApi.get(`/api/tasks/${taskId}/activities`);

    expect(response.status).toBe(200);

    const activities = response.body.activities;

    expect(activities[0].action).toBe("STATUS_CHANGED");
    expect(activities[1].action).toBe("CREATED");

    expect(
      Temporal.Instant.compare(
        Temporal.Instant.from(activities[0].createdAt),
        Temporal.Instant.from(activities[1].createdAt),
      ),
    ).toBeGreaterThan(0);
  });

  it("returns 404 when the task does not exist", async () => {
    const response = await ownerApi.get("/api/tasks/2000000000/activities");

    expect(response.status).toBe(404);
  });

  it("returns 404 when the task is soft-deleted", async () => {
    const existingTask = await db.orm.public.Task.where({
      id: taskId,
    }).first();

    expect(existingTask).not.toBeNull();

    const deletedTask = await db.orm.public.Task.create({
      title: "Deleted Activity API Test",
      description: "Testing deleted task activity access",
      status: 1,
      priority: 2,
      projectId: existingTask!.projectId,
      creatorId: ownerId,
    });

    taskIds.push(deletedTask.id);

    await db.orm.public.Task.where({
      id: deletedTask.id,
    }).update({
      deletedAt: Temporal.Now.instant().toString(),
      deletedById: ownerId,
    });

    const response = await ownerApi.get(
      `/api/tasks/${deletedTask.id}/activities`,
    );

    expect(response.status).toBe(404);
  });

  it("returns 401 when the request is unauthenticated", async () => {
    const response = await request(app).get(`/api/tasks/${taskId}/activities`);

    expect(response.status).toBe(401);
  });

  it("returns 400 for an invalid task ID", async () => {
    const response = await ownerApi.get("/api/tasks/invalid/activities");

    expect(response.status).toBe(400);
  });
});
