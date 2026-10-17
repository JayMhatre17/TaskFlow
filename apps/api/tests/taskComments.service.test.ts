import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../src/prisma/db";
import { createUser } from "../src/service/auth.service";
import { Temporal } from "@js-temporal/polyfill";
import {
  createTaskComment,
  deleteTaskComment,
  getTaskComments,
  updateTaskComment,
} from "../src/service/taskComment.service";

describe("Task Comment Service", () => {
  const createdUserIds: number[] = [];
  const createdProjectIds: number[] = [];
  const createdTaskIds: number[] = [];

  const createTestUser = async (suffix: string) => {
    const user = await createUser(
      `Task Comment Test ${suffix}`,
      `task-comment-${suffix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}@example.com`,
      "password123",
    );

    createdUserIds.push(user.id);
    return user;
  };

  const createTestProject = async (ownerId: number) => {
    const project = await db.orm.public.Project.create({
      name: `[TEST] Comment Project ${Date.now()}`,
      description: "Task comment service test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId,
    });

    createdProjectIds.push(project.id);
    return project;
  };

  const createTestTask = async (projectId: number, creatorId: number) => {
    const task = await db.orm.public.Task.create({
      title: `[TEST] Comment Task ${Date.now()}`,
      description: "Task comment service test",
      status: 1,
      priority: 2,
      projectId,
      creatorId,
    });

    createdTaskIds.push(task.id);
    return task;
  };

  const addProjectMember = async (
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

    const project = await createTestProject(owner.id);
    await addProjectMember(project.id, owner.id, member.id);

    const task = await createTestTask(project.id, owner.id);

    return { owner, member, outsider, project, task };
  };

  beforeAll(async () => {
    // No shared fixture required; each test creates its own records.
  });

  afterAll(async () => {
    for (const taskId of createdTaskIds) {
      await db.orm.public.TaskComment.where({ taskId }).deleteAll();
      await db.orm.public.Task.where({ id: taskId }).deleteAll();
    }

    for (const projectId of createdProjectIds) {
      await db.orm.public.ProjectMember.where({ projectId }).deleteAll();
      await db.orm.public.Project.where({ id: projectId }).deleteAll();
    }

    for (const userId of createdUserIds) {
      await db.orm.public.User.where({ id: userId }).deleteAll();
    }
  });

  it("should allow the project owner to list comments", async () => {
    const { owner, task } = await createFixture();

    await createTaskComment(task.id, { content: "Owner comment" }, owner.id);

    const comments = await getTaskComments(task.id, owner.id);

    expect(comments).toHaveLength(1);
    expect(comments[0].content).toBe("Owner comment");
  });

  it("should allow an active project member to list comments", async () => {
    const { owner, member, task } = await createFixture();

    await createTaskComment(
      task.id,
      { content: "Member-visible comment" },
      owner.id,
    );

    const comments = await getTaskComments(task.id, member.id);

    expect(comments).toHaveLength(1);
    expect(comments[0].content).toBe("Member-visible comment");
  });

  it("should reject a non-member listing comments", async () => {
    const { outsider, task } = await createFixture();

    await expect(getTaskComments(task.id, outsider.id)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("should allow an active member to create a comment", async () => {
    const { member, task } = await createFixture();

    const comment = await createTaskComment(
      task.id,
      { content: "  A new comment  " },
      member.id,
    );

    expect(comment.authorId).toBe(member.id);
    expect(comment.taskId).toBe(task.id);
    expect(comment.content).toBe("A new comment");
    expect(comment.deletedAt).toBeNull();
  });

  it("should reject a non-member creating a comment", async () => {
    const { outsider, task } = await createFixture();

    await expect(
      createTaskComment(task.id, { content: "Unauthorized" }, outsider.id),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("should allow an author to edit their own comment", async () => {
    const { member, task } = await createFixture();

    const comment = await createTaskComment(
      task.id,
      { content: "Original content" },
      member.id,
    );

    const updated = await updateTaskComment(
      comment.id,
      { content: "Updated content" },
      member.id,
    );

    expect(updated?.content).toBe("Updated content");
    expect(updated?.id).toBe(comment.id);
  });

  it("should prevent a member from editing another user's comment", async () => {
    const { owner, member, task } = await createFixture();

    const comment = await createTaskComment(
      task.id,
      { content: "Owner's comment" },
      owner.id,
    );

    await expect(
      updateTaskComment(
        comment.id,
        { content: "Changed by member" },
        member.id,
      ),
    ).rejects.toMatchObject({ statusCode: 403 });

    const unchanged = await db.orm.public.TaskComment.where({
      id: comment.id,
    }).first();

    expect(unchanged?.content).toBe("Owner's comment");
  });

  it("should allow an author to soft-delete their own comment", async () => {
    const { member, task } = await createFixture();

    const comment = await createTaskComment(
      task.id,
      { content: "Delete me" },
      member.id,
    );

    const deleted = await deleteTaskComment(comment.id, member.id);

    expect(deleted?.deletedAt).not.toBeNull();

    const stored = await db.orm.public.TaskComment.where({
      id: comment.id,
    }).first();

    expect(stored).not.toBeNull();
    expect(stored?.deletedAt).not.toBeNull();
  });

  it("should prevent a member from deleting another user's comment", async () => {
    const { owner, member, task } = await createFixture();

    const comment = await createTaskComment(
      task.id,
      { content: "Keep this comment" },
      owner.id,
    );

    await expect(
      deleteTaskComment(comment.id, member.id),
    ).rejects.toMatchObject({
      statusCode: 403,
    });

    const stored = await db.orm.public.TaskComment.where({
      id: comment.id,
    }).first();

    expect(stored?.deletedAt).toBeNull();
  });

  it("should exclude soft-deleted comments from the comment list", async () => {
    const { owner, task } = await createFixture();

    const active = await createTaskComment(
      task.id,
      { content: "Visible comment" },
      owner.id,
    );

    const deleted = await createTaskComment(
      task.id,
      { content: "Hidden comment" },
      owner.id,
    );

    await deleteTaskComment(deleted.id, owner.id);

    const comments = await getTaskComments(task.id, owner.id);

    expect(comments.map((comment) => comment.id)).toContain(active.id);
    expect(comments.map((comment) => comment.id)).not.toContain(deleted.id);
  });

  it("should return 404 when editing an already-deleted comment", async () => {
    const { owner, task } = await createFixture();

    const comment = await createTaskComment(
      task.id,
      { content: "Deleted comment" },
      owner.id,
    );

    await deleteTaskComment(comment.id, owner.id);

    await expect(
      updateTaskComment(comment.id, { content: "Try editing" }, owner.id),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("should return 404 when deleting an already-deleted comment", async () => {
    const { owner, task } = await createFixture();

    const comment = await createTaskComment(
      task.id,
      { content: "Deleted comment" },
      owner.id,
    );

    await deleteTaskComment(comment.id, owner.id);

    await expect(deleteTaskComment(comment.id, owner.id)).rejects.toMatchObject(
      {
        statusCode: 404,
      },
    );
  });

  it("should reject comments on a soft-deleted task", async () => {
    const { owner, task } = await createFixture();

    await db.orm.public.Task.where({ id: task.id }).update({
      deletedAt: new Date().toISOString(),
    });

    await expect(
      createTaskComment(task.id, { content: "Too late" }, owner.id),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("should return 404 for a nonexistent task", async () => {
    const { owner } = await createFixture();

    await expect(getTaskComments(999999999, owner.id)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
