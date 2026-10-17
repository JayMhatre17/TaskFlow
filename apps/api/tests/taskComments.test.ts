import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import { db } from "../src/prisma/db";
import { createUser } from "../src/service/auth.service";
import { createSession } from "../src/service/session.service";
import { Temporal } from "@js-temporal/polyfill";
import { authenticatedRequestWithSession } from "./helpers/auth.helper";
import {
  createTaskComment,
  deleteTaskComment,
  updateTaskComment,
} from "../src/service/taskComment.service";

describe("Task Comment API", () => {
  const userIds: number[] = [];
  const projectIds: number[] = [];
  const taskIds: number[] = [];

  const createTestUser = async (suffix: string) => {
    const user = await createUser(
      `Comment API ${suffix}`,
      `comment-api-${suffix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}@example.com`,
      "password123",
    );

    userIds.push(user.id);

    const session = await createSession(user.id);

    return {
      user,
      sessionId: session.id,
      api: authenticatedRequestWithSession(session.id),
    };
  };

  const createTestProject = async (ownerId: number) => {
    const project = await db.orm.public.Project.create({
      name: `[TEST] Comment API Project ${Date.now()}`,
      description: "Comment API test",
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
      title: `[TEST] Comment API Task ${Date.now()}`,
      description: "Comment API test",
      status: 1,
      priority: 2,
      projectId,
      creatorId,
    });

    taskIds.push(task.id);
    return task;
  };

  const addMember = async (
    projectId: number,
    ownerId: number,
    userId: number,
  ) => {
    await db.orm.public.ProjectMember.create({
      projectId,
      userId,
      addedById: ownerId,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });
  };

  const createFixture = async () => {
    const owner = await createTestUser("owner");
    const member = await createTestUser("member");
    const outsider = await createTestUser("outsider");

    const project = await createTestProject(owner.user.id);
    await addMember(project.id, owner.user.id, member.user.id);

    const task = await createTestTask(project.id, owner.user.id);

    return { owner, member, outsider, project, task };
  };

  afterAll(async () => {
    for (const taskId of taskIds) {
      await db.orm.public.TaskComment.where({ taskId }).deleteAll();
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

  it("should list comments for the project owner", async () => {
    const { owner, task } = await createFixture();

    const created = await owner.api
      .post(`/api/tasks/${task.id}/comments`)
      .send({ content: "Owner comment" });

    expect(created.status).toBe(201);

    const response = await owner.api.get(`/api/tasks/${task.id}/comments`);

    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(1);
    expect(response.body.comments[0].content).toBe("Owner comment");
  });

  it("should allow an active member to list comments", async () => {
    const { owner, member, task } = await createFixture();

    await owner.api
      .post(`/api/tasks/${task.id}/comments`)
      .send({ content: "Visible comment" });

    const response = await member.api.get(`/api/tasks/${task.id}/comments`);

    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(1);
  });

  it("should reject a non-member listing comments", async () => {
    const { outsider, task } = await createFixture();

    const response = await outsider.api.get(`/api/tasks/${task.id}/comments`);

    expect(response.status).toBe(404);
  });

  it("should create a comment and trim its content", async () => {
    const { owner, task } = await createFixture();

    const response = await owner.api
      .post(`/api/tasks/${task.id}/comments`)
      .send({ content: "  Hello from API  " });

    expect(response.status).toBe(201);
    expect(response.body.comment.content).toBe("Hello from API");
    expect(response.body.comment.authorId).toBe(owner.user.id);
  });

  it("should reject an empty comment", async () => {
    const { owner, task } = await createFixture();

    const response = await owner.api
      .post(`/api/tasks/${task.id}/comments`)
      .send({ content: "   " });

    expect(response.status).toBe(400);
  });

  it("should reject a comment longer than 2000 characters", async () => {
    const { owner, task } = await createFixture();

    const response = await owner.api
      .post(`/api/tasks/${task.id}/comments`)
      .send({ content: "x".repeat(2001) });

    expect(response.status).toBe(400);
  });

  it("should reject a non-member creating a comment", async () => {
    const { outsider, task } = await createFixture();

    const response = await outsider.api
      .post(`/api/tasks/${task.id}/comments`)
      .send({ content: "Unauthorized comment" });

    expect(response.status).toBe(404);
  });

  it("should allow an author to edit their comment", async () => {
    const { owner, task } = await createFixture();

    const created = await owner.api
      .post(`/api/tasks/${task.id}/comments`)
      .send({ content: "Original content" });

    const response = await owner.api
      .patch(`/api/tasks/${task.id}/comments/${created.body.comment.id}`)
      .send({ content: "Updated content" });

    expect(response.status).toBe(200);
    expect(response.body.comment.content).toBe("Updated content");
  });

  it("should prevent a member from editing another user's comment", async () => {
    const { owner, member, task } = await createFixture();

    const created = await owner.api
      .post(`/api/tasks/${task.id}/comments`)
      .send({ content: "Owner's comment" });

    const response = await member.api
      .patch(`/api/tasks/${task.id}/comments/${created.body.comment.id}`)
      .send({ content: "Unauthorized edit" });

    expect(response.status).toBe(403);
  });

  it("should soft-delete a comment authored by the requester", async () => {
    const { owner, task } = await createFixture();

    const created = await owner.api
      .post(`/api/tasks/${task.id}/comments`)
      .send({ content: "Delete me" });

    const commentId = created.body.comment.id;

    const response = await owner.api.delete(
      `/api/tasks/${task.id}/comments/${commentId}`,
    );

    expect(response.status).toBe(204);

    const stored = await db.orm.public.TaskComment.where({
      id: commentId,
    }).first();

    expect(stored).not.toBeNull();
    expect(stored?.deletedAt).not.toBeNull();
  });

  it("should prevent a member from deleting another user's comment", async () => {
    const { owner, member, task } = await createFixture();

    const created = await owner.api
      .post(`/api/tasks/${task.id}/comments`)
      .send({ content: "Keep this comment" });

    const response = await member.api.delete(
      `/api/tasks/${task.id}/comments/${created.body.comment.id}`,
    );

    expect(response.status).toBe(403);
  });

  it("should not return deleted comments", async () => {
    const { owner, task } = await createFixture();

    const created = await owner.api
      .post(`/api/tasks/${task.id}/comments`)
      .send({ content: "Hidden comment" });

    await owner.api.delete(
      `/api/tasks/${task.id}/comments/${created.body.comment.id}`,
    );

    const response = await owner.api.get(`/api/tasks/${task.id}/comments`);

    expect(response.status).toBe(200);
    expect(response.body.comments).toEqual([]);
  });

  it("should reject unauthenticated comment requests", async () => {
    const { task } = await createFixture();

    const response = await request(app).get(`/api/tasks/${task.id}/comments`);

    expect(response.status).toBe(401);
  });

  it("should reject invalid task and comment IDs", async () => {
    const { owner } = await createFixture();

    const invalidTask = await owner.api.get("/api/tasks/invalid/comments");

    expect(invalidTask.status).toBe(400);

    const invalidComment = await owner.api
      .patch("/api/tasks/1/comments/invalid")
      .send({ content: "Updated" });

    expect(invalidComment.status).toBe(400);
  });
  it("should create a task activity when a comment is added", async () => {
    const { member, task } = await createFixture();

    await createTaskComment(
      task.id,
      { content: "Activity test comment" },
      member.user.id,
    );

    const activities = await db.orm.public.TaskActivity.where({
      taskId: task.id,
      action: "COMMENT_ADDED",
    }).all();

    expect(activities).toHaveLength(1);
    expect(activities[0].actorId).toBe(member.user.id);
    expect(activities[0].description).toBe("Added a comment");
  });

  it("should update the comment timestamp and record edit activity", async () => {
    const { member, task } = await createFixture();

    const comment = await createTaskComment(
      task.id,
      { content: "Original comment" },
      member.user.id,
    );

    const updated = await updateTaskComment(
      comment.id,
      { content: "Edited comment" },
      member.user.id,
    );

    expect(updated?.content).toBe("Edited comment");
    expect(updated?.updatedAt.toString()).not.toBe(
      comment.updatedAt.toString(),
    );

    const activities = await db.orm.public.TaskActivity.where({
      taskId: task.id,
      action: "COMMENT_UPDATED",
    }).all();

    expect(activities).toHaveLength(1);
    expect(activities[0].actorId).toBe(member.user.id);
    expect(activities[0].description).toBe("Updated a comment");
  });

  it("should record activity when a comment is soft-deleted", async () => {
    const { member, task } = await createFixture();
    const comment = await createTaskComment(
      task.id,
      { content: "Comment to delete" },
      member.user.id,
    );

    await deleteTaskComment(comment.id, member.user.id);

    const activities = await db.orm.public.TaskActivity.where({
      taskId: task.id,
      action: "COMMENT_DELETED",
    }).all();

    expect(activities).toHaveLength(1);
    expect(activities[0].actorId).toBe(member.user.id);
    expect(activities[0].description).toBe("Deleted a comment");
  });
});
