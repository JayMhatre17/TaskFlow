import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import { db } from "../src/prisma/db";
import { createUser } from "../src/service/auth.service";
import {
  createProjectActivity,
  getProjectActivities,
} from "../src/service/projectActivity.service";

describe("Project Activity Service", () => {
  let ownerId: number;
  let memberId: number;
  let outsiderId: number;
  let projectId: number;
  let memberProjectId: number;

  const userIds: number[] = [];
  const projectIds: number[] = [];

  beforeAll(async () => {
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

    const project = await db.orm.public.Project.create({
      name: "Activity Test Project",
      description: "Project for activity tests",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId,
    });

    projectId = project.id;
    projectIds.push(projectId);

    await db.orm.public.ProjectMember.create({
      projectId,
      userId: memberId,
      addedById: ownerId,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });

    const memberProject = await db.orm.public.Project.create({
      name: "Member Activity Test Project",
      description: "Separate project for activity creation tests",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId,
    });

    memberProjectId = memberProject.id;
    projectIds.push(memberProjectId);
  });

  afterAll(async () => {
    // Remove activity records before deleting their projects.
    for (const id of projectIds) {
      await db.orm.public.ProjectActivity.where({
        projectId: id,
      }).deleteAll();
    }

    // Remove membership records before deleting projects/users.
    for (const id of projectIds) {
      await db.orm.public.ProjectMember.where({
        projectId: id,
      }).deleteAll();
    }

    for (const id of userIds) {
      await db.orm.public.Session.where({
        userId: id,
      }).deleteAll();
    }

    for (const id of projectIds) {
      await db.orm.public.Project.where({
        id,
      }).deleteAll();
    }

    for (const id of userIds) {
      await db.orm.public.User.where({
        id,
      }).deleteAll();
    }
  });

  const createTestActivity = async (
    targetProjectId: number,
    actorId: number | null,
    overrides: {
      action?: "CREATED" | "UPDATED" | "OWNER_CHANGED" | "DELETED" | "RESTORED";
      field?: string | null;
      oldValue?: string | null;
      newValue?: string | null;
      description?: string | null;
      createdAt?: string;
    } = {},
  ) => {
    return db.orm.public.ProjectActivity.create({
      projectId: targetProjectId,
      actorId,
      action: overrides.action ?? "UPDATED",
      field: overrides.field ?? null,
      oldValue: overrides.oldValue ?? null,
      newValue: overrides.newValue ?? null,
      description: overrides.description ?? null,
      ...(overrides.createdAt !== undefined && {
        createdAt: overrides.createdAt,
      }),
    });
  };

  it("creates a project activity with the provided data", async () => {
    const activity = await createProjectActivity({
      projectId: memberProjectId,
      actorId: ownerId,
      action: "UPDATED",
      field: "name",
      oldValue: "Old project name",
      newValue: "New project name",
      description: "Project name updated",
    });

    expect(activity.projectId).toBe(memberProjectId);
    expect(activity.actorId).toBe(ownerId);
    expect(activity.action).toBe("UPDATED");
    expect(activity.field).toBe("name");
    expect(activity.oldValue).toBe("Old project name");
    expect(activity.newValue).toBe("New project name");
    expect(activity.description).toBe("Project name updated");
  });

  it("allows creating an activity without an actor", async () => {
    const activity = await createProjectActivity({
      projectId: memberProjectId,
      actorId: null,
      action: "RESTORED",
      description: "Project restored by system",
    });

    expect(activity.projectId).toBe(memberProjectId);
    expect(activity.actorId).toBeNull();
    expect(activity.action).toBe("RESTORED");
  });

  it("rejects activity creation for a nonexistent project", async () => {
    await expect(
      createProjectActivity({
        projectId: 2_000_000_000,
        actorId: ownerId,
        action: "CREATED",
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("rejects activity creation for a nonexistent actor", async () => {
    await expect(
      createProjectActivity({
        projectId: memberProjectId,
        actorId: 2_000_000_000,
        action: "UPDATED",
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("returns project activities newest first", async () => {
    await createTestActivity(projectId, ownerId, {
      action: "UPDATED",
      description: "Older activity",
      createdAt: Temporal.Instant.from("2026-01-01T10:00:00Z").toString(),
    });

    await createTestActivity(projectId, ownerId, {
      action: "OWNER_CHANGED",
      description: "Newer activity",
      createdAt: Temporal.Instant.from("2026-01-02T10:00:00Z").toString(),
    });

    const activities = await getProjectActivities(projectId, ownerId);

    const olderIndex = activities.findIndex(
      (activity) => activity.description === "Older activity",
    );

    const newerIndex = activities.findIndex(
      (activity) => activity.description === "Newer activity",
    );

    expect(olderIndex).toBeGreaterThanOrEqual(0);
    expect(newerIndex).toBeGreaterThanOrEqual(0);
    expect(newerIndex).toBeLessThan(olderIndex);
  });

  it("allows the project owner to retrieve project activities", async () => {
    await createTestActivity(projectId, ownerId, {
      action: "CREATED",
      description: "Owner-visible activity",
    });

    const activities = await getProjectActivities(projectId, ownerId);

    expect(activities.length).toBeGreaterThan(0);
    expect(
      activities.every((activity) => activity.projectId === projectId),
    ).toBe(true);
  });

  it("allows an active project member to retrieve project activities", async () => {
    await createTestActivity(projectId, ownerId, {
      action: "UPDATED",
      description: "Member-visible activity",
    });

    const activities = await getProjectActivities(projectId, memberId);

    expect(activities.length).toBeGreaterThan(0);
    expect(
      activities.every((activity) => activity.projectId === projectId),
    ).toBe(true);
  });

  it("rejects access for a user who is not a project member", async () => {
    await expect(
      getProjectActivities(projectId, outsiderId),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("returns 404 when retrieving activities for a nonexistent project", async () => {
    await expect(
      getProjectActivities(2_000_000_000, ownerId),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
