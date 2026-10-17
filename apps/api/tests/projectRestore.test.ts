import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import { db } from "../src/prisma/db";
import { createUser } from "../src/service/auth.service";
import { deleteProject, restoreProject } from "../src/service/project.service";

describe("Project Restoration Service", () => {
  let ownerId: number;
  let otherUserId: number;

  const userIds: number[] = [];
  const projectIds: number[] = [];

  beforeAll(async () => {
    const owner = await createUser(
      "Project Restore Owner",
      `project-restore-owner-${Date.now()}@example.com`,
      "TestPassword123!",
    );

    const otherUser = await createUser(
      "Project Restore Other User",
      `project-restore-other-${Date.now()}@example.com`,
      "TestPassword123!",
    );

    ownerId = owner.id;
    otherUserId = otherUser.id;

    userIds.push(ownerId, otherUserId);
  });

  afterAll(async () => {
    // Remove activity records before removing their projects.
    for (const projectId of projectIds) {
      await db.orm.public.ProjectActivity.where({
        projectId,
      }).deleteAll();
    }

    for (const projectId of projectIds) {
      await db.orm.public.ProjectMember.where({
        projectId,
      }).deleteAll();
    }

    for (const userId of userIds) {
      await db.orm.public.Session.where({
        userId,
      }).deleteAll();
    }

    for (const projectId of projectIds) {
      await db.orm.public.Project.where({
        id: projectId,
      }).deleteAll();
    }

    for (const userId of userIds) {
      await db.orm.public.User.where({
        id: userId,
      }).deleteAll();
    }
  });

  const createTestProject = async () => {
    const project = await db.orm.public.Project.create({
      name: `Restore Test Project ${Date.now()}-${Math.random()}`,
      description: "Project restoration test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId,
    });

    projectIds.push(project.id);

    return project;
  };

  const softDeleteProject = async (projectId: number) => {
    const now = Temporal.Now.instant();

    return db.orm.public.Project.where({
      id: projectId,
    }).update({
      deletedAt: now.toString(),
      deletedById: ownerId,
      scheduledDeletionAt: now.add({ seconds: 90 * 24 * 60 * 60 }).toString(),
    });
  };

  it("restores a soft-deleted project", async () => {
    const project = await createTestProject();

    await softDeleteProject(project.id);

    const restoredProject = await restoreProject(project.id, ownerId);

    expect(restoredProject).not.toBeNull();

    const savedProject = await db.orm.public.Project.where({
      id: project.id,
    }).first();

    expect(savedProject).not.toBeNull();
    expect(savedProject?.deletedAt).toBeNull();
    expect(savedProject?.deletedById).toBeNull();
    expect(savedProject?.scheduledDeletionAt).toBeNull();
  });

  it("records a RESTORED activity when restoring a project", async () => {
    const project = await createTestProject();

    await softDeleteProject(project.id);

    await restoreProject(project.id, ownerId);

    const activities = await db.orm.public.ProjectActivity.where({
      projectId: project.id,
      action: "RESTORED",
    }).all();

    expect(activities).toHaveLength(1);
    expect(activities[0].actorId).toBe(ownerId);
    expect(activities[0].oldValue).toBe("deleted");
    expect(activities[0].newValue).toBe("active");
    expect(activities[0].description).toContain("was restored");
  });

  it("returns null when the project is already active", async () => {
    const project = await createTestProject();

    const result = await restoreProject(project.id, ownerId);

    expect(result).toBeNull();

    const activities = await db.orm.public.ProjectActivity.where({
      projectId: project.id,
      action: "RESTORED",
    }).all();

    expect(activities).toHaveLength(0);
  });

  it("returns null when the project does not exist", async () => {
    const result = await restoreProject(2_000_000_000, ownerId);

    expect(result).toBeNull();
  });

  it("returns null when a non-owner attempts to restore the project", async () => {
    const project = await createTestProject();

    await softDeleteProject(project.id);

    const result = await restoreProject(project.id, otherUserId);

    expect(result).toBeNull();

    const savedProject = await db.orm.public.Project.where({
      id: project.id,
    }).first();

    expect(savedProject?.deletedAt).not.toBeNull();
    expect(savedProject?.deletedById).toBe(ownerId);
    expect(savedProject?.scheduledDeletionAt).not.toBeNull();

    const activities = await db.orm.public.ProjectActivity.where({
      projectId: project.id,
      action: "RESTORED",
    }).all();

    expect(activities).toHaveLength(0);
  });

  it("allows project access again after restoration", async () => {
    const project = await createTestProject();

    await softDeleteProject(project.id);

    await restoreProject(project.id, ownerId);

    const restoredProject = await db.orm.public.Project.where({
      id: project.id,
      ownerId,
      deletedAt: null,
    }).first();

    expect(restoredProject).not.toBeNull();
    expect(restoredProject?.id).toBe(project.id);
  });

  it("preserves existing project activity history when restoring", async () => {
    const project = await createTestProject();

    await db.orm.public.ProjectActivity.create({
      projectId: project.id,
      actorId: ownerId,
      action: "CREATED",
      field: null,
      oldValue: null,
      newValue: null,
      description: "Original creation activity",
    });

    await softDeleteProject(project.id);

    await db.orm.public.ProjectActivity.create({
      projectId: project.id,
      actorId: ownerId,
      action: "DELETED",
      field: null,
      oldValue: null,
      newValue: null,
      description: "Project deleted",
    });

    await restoreProject(project.id, ownerId);

    const activities = await db.orm.public.ProjectActivity.where({
      projectId: project.id,
    }).all();

    expect(
      activities.some(
        (activity) => activity.description === "Original creation activity",
      ),
    ).toBe(true);

    expect(activities.some((activity) => activity.action === "DELETED")).toBe(
      true,
    );

    expect(activities.some((activity) => activity.action === "RESTORED")).toBe(
      true,
    );
  });
});
