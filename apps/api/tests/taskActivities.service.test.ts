import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import { db } from "../src/prisma/db";
import { createUser } from "../src/service/auth.service";
import { getTaskActivities } from "../src/service/task.service";
import {
  createTaskComment,
  deleteTaskComment,
  updateTaskComment,
} from "../src/service/taskComment.service";

const userIds: number[] = [];
const projectIds: number[] = [];
const taskIds: number[] = [];

describe("Task Activity Service", () => {
  let ownerId: number;
  let memberId: number;
  let outsiderId: number;
  let taskId: number;
  let projectId: number;

  beforeAll(async () => {
    // Create users
    const owner = await createUser(
      "Activity Owner",
      `activity-owner-${Date.now()}@example.com`,
      "TestPassword123!",
    );

    const member = await createUser(
      "Activity Member",
      `activity-member-${Date.now()}@example.com`,
      "TestPassword123!",
    );

    const outsider = await createUser(
      "Activity Outsider",
      `activity-outsider-${Date.now()}@example.com`,
      "TestPassword123!",
    );

    ownerId = owner.id;
    memberId = member.id;
    outsiderId = outsider.id;

    userIds.push(ownerId, memberId, outsiderId);

    // Create project
    const project = await db.orm.public.Project.create({
      name: `Task Activity Test ${Date.now()}`,
      description: "Project for task activity service tests",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId,
    });

    projectId = project.id;
    projectIds.push(projectId);

    // Add an active project member
    await db.orm.public.ProjectMember.create({
      projectId,
      userId: memberId,
      addedById: ownerId,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });

    // Create task
    const task = await db.orm.public.Task.create({
      title: "Task Activity Test",
      description: "Testing task activity retrieval",
      status: 1,
      priority: 2,
      projectId,
      creatorId: ownerId,
    });

    taskId = task.id;
    taskIds.push(taskId);

    // Seed two activities with different timestamps
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
    // Delete dependent records first
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
    const activities = await getTaskActivities(taskId, ownerId);

    expect(activities).toHaveLength(2);
    expect(activities.map((activity) => activity.action)).toContain("CREATED");
    expect(activities.map((activity) => activity.action)).toContain(
      "STATUS_CHANGED",
    );
  });

  it("allows an active project member to retrieve task activities", async () => {
    const activities = await getTaskActivities(taskId, memberId);

    expect(activities).toHaveLength(2);
  });

  it("denies a non-member access to task activities", async () => {
    await expect(getTaskActivities(taskId, outsiderId)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("returns activities newest first", async () => {
    const activities = await getTaskActivities(taskId, ownerId);

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
    await expect(
      getTaskActivities(2_000_000_000, ownerId),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("returns 404 when the task is soft-deleted", async () => {
    // Create a separate task so other tests can continue using the active task.
    const deletedTask = await db.orm.public.Task.create({
      title: "Deleted Activity Test",
      description: "Testing activity access for deleted tasks",
      status: 1,
      priority: 2,
      projectId,
      creatorId: ownerId,
    });

    taskIds.push(deletedTask.id);

    await db.orm.public.Task.where({
      id: deletedTask.id,
    }).update({
      deletedAt: Temporal.Now.instant().toString(),
      deletedById: ownerId,
    });

    await expect(
      getTaskActivities(deletedTask.id, ownerId),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });
  it("includes comment lifecycle events in task activity history", async () => {
    const comment = await createTaskComment(
      taskId,
      { content: "Original activity test comment" },
      ownerId,
    );

    await updateTaskComment(
      comment.id,
      { content: "Updated activity test comment" },
      ownerId,
    );

    await deleteTaskComment(comment.id, ownerId);

    const activities = await getTaskActivities(taskId, ownerId);

    const commentActions = activities
      .filter((activity) =>
        ["COMMENT_ADDED", "COMMENT_UPDATED", "COMMENT_DELETED"].includes(
          activity.action,
        ),
      )
      .map((activity) => activity.action);

    expect(commentActions).toHaveLength(3);
    expect(commentActions).toContain("COMMENT_ADDED");
    expect(commentActions).toContain("COMMENT_UPDATED");
    expect(commentActions).toContain("COMMENT_DELETED");
  });
});
