import { afterEach, describe, expect, it, vi } from "vitest";

import { db } from "../src/prisma/db";
import { createUser } from "../src/service/auth.service";
import {
  addProjectMember,
  removeProjectMember,
} from "../src/service/projectMember.service";
import * as notificationService from "../src/service/notification.service";
import { deleteTestProject } from "./helpers/project.helpers";
import { Temporal } from "@js-temporal/polyfill";

describe("ProjectMember service", () => {
  const createdProjectIds: number[] = [];

  const createTestUser = async (suffix: string) => {
    const user = await createUser(
      `Project Member Test ${suffix}`,
      `project-member-${suffix}-${Date.now()}@example.com`,
      "password123",
    );

    return user;
  };

  const createTestProject = async (ownerId: number) => {
    const project = await db.orm.public.Project.create({
      name: `[TEST] Project Member ${Date.now()}`,
      description: "Project member service test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-10-05T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId,
    });

    createdProjectIds.push(project.id);

    return project;
  };

  afterEach(async () => {
    for (const projectId of createdProjectIds) {
      await db.orm.public.Project.where({ id: projectId }).delete();
    }

    createdProjectIds.length = 0;

    vi.restoreAllMocks();
  });

  it("should unassign a removed member's tasks only in the removed project and record history", async () => {
    const owner = await createTestUser("remove-assignee-owner");
    const memberUser = await createTestUser("remove-assignee-member");
    const otherMember = await createTestUser("remove-assignee-other-member");
    const otherProjectOwner = await createTestUser("remove-assignee-other-owner");
    const project = await createTestProject(owner.id);
    const otherProject = await createTestProject(otherProjectOwner.id);

    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: memberUser.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });
    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: otherMember.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });

    const assignedTask = await db.orm.public.Task.create({
      title: "[TEST] Member task to unassign",
      description: "Task in the project where membership is removed",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
      assigneeId: memberUser.id,
    });
    const otherAssignedTask = await db.orm.public.Task.create({
      title: "[TEST] Other member task",
      description: "Task assigned to another member",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
      assigneeId: otherMember.id,
    });
    const otherProjectTask = await db.orm.public.Task.create({
      title: "[TEST] Member task in another project",
      description: "Task outside the removed membership project",
      status: 1,
      priority: 2,
      projectId: otherProject.id,
      creatorId: otherProjectOwner.id,
      assigneeId: memberUser.id,
    });

    await removeProjectMember(project.id, memberUser.id, owner.id);

    const removedMembership = await db.orm.public.ProjectMember.where({
      projectId: project.id,
      userId: memberUser.id,
    }).first();
    expect(removedMembership?.removedAt).not.toBeNull();

    const memberTaskAfterRemoval = await db.orm.public.Task.where({
      id: assignedTask.id,
    }).first();
    expect(memberTaskAfterRemoval?.assigneeId).toBeNull();

    const assignmentHistory = await db.orm.public.TaskAssignmentHistory.where({
      taskId: assignedTask.id,
    }).all();
    expect(assignmentHistory).toHaveLength(1);
    expect(assignmentHistory[0]).toMatchObject({
      previousAssigneeId: memberUser.id,
      newAssigneeId: null,
      performedById: owner.id,
      action: "UNASSIGNED",
      reason: "Project member removed",
    });

    const otherMemberTaskAfterRemoval = await db.orm.public.Task.where({
      id: otherAssignedTask.id,
    }).first();
    expect(otherMemberTaskAfterRemoval?.assigneeId).toBe(otherMember.id);
    expect(
      await db.orm.public.TaskAssignmentHistory.where({
        taskId: otherAssignedTask.id,
      }).all(),
    ).toHaveLength(0);

    const otherProjectTaskAfterRemoval = await db.orm.public.Task.where({
      id: otherProjectTask.id,
    }).first();
    expect(otherProjectTaskAfterRemoval?.assigneeId).toBe(memberUser.id);
    expect(
      await db.orm.public.TaskAssignmentHistory.where({
        taskId: otherProjectTask.id,
      }).all(),
    ).toHaveLength(0);

    const memberTaskNotifications = await db.orm.public.Notification.where({
      taskId: assignedTask.id,
      userId: memberUser.id,
    }).all();
    expect(memberTaskNotifications).toHaveLength(0);

    const membershipHistory = await db.orm.public.ProjectMembershipHistory.where({
      projectId: project.id,
      userId: memberUser.id,
      action: "REMOVED",
    }).all();
    expect(membershipHistory).toHaveLength(1);
  });

  it("should remove a member with no assigned tasks and safely reject repeated removal", async () => {
    const owner = await createTestUser("remove-no-tasks-owner");
    const memberUser = await createTestUser("remove-no-tasks-member");
    const project = await createTestProject(owner.id);
    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: memberUser.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });

    await expect(
      removeProjectMember(project.id, memberUser.id, owner.id),
    ).resolves.toBeUndefined();

    const membership = await db.orm.public.ProjectMember.where({
      projectId: project.id,
      userId: memberUser.id,
    }).first();
    expect(membership?.removedAt).not.toBeNull();

    await expect(
      removeProjectMember(project.id, memberUser.id, owner.id),
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(
      await db.orm.public.ProjectMembershipHistory.where({
        projectId: project.id,
        userId: memberUser.id,
        action: "REMOVED",
      }).all(),
    ).toHaveLength(1);
  });

  it("should not change membership, assignments, history, or notifications for unauthorized removal", async () => {
    const owner = await createTestUser("remove-unauthorized-owner");
    const memberUser = await createTestUser("remove-unauthorized-target");
    const requester = await createTestUser("remove-unauthorized-requester");
    const project = await createTestProject(owner.id);
    for (const user of [memberUser, requester]) {
      await db.orm.public.ProjectMember.create({
        projectId: project.id,
        userId: user.id,
        addedById: owner.id,
        joinedAt: new Date().toISOString(),
        removedAt: null,
      });
    }
    const task = await db.orm.public.Task.create({
      title: "[TEST] Unauthorized removal assignment",
      description: "Unauthorized removal must not change this task",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
      assigneeId: memberUser.id,
    });

    await expect(
      removeProjectMember(project.id, memberUser.id, requester.id),
    ).rejects.toMatchObject({ statusCode: 403 });

    const membership = await db.orm.public.ProjectMember.where({
      projectId: project.id,
      userId: memberUser.id,
    }).first();
    expect(membership?.removedAt).toBeNull();
    expect(
      (await db.orm.public.Task.where({ id: task.id }).first())?.assigneeId,
    ).toBe(memberUser.id);
    expect(
      await db.orm.public.ProjectMembershipHistory.where({
        projectId: project.id,
        userId: memberUser.id,
        action: "REMOVED",
      }).all(),
    ).toHaveLength(0);
    expect(
      await db.orm.public.TaskAssignmentHistory.where({ taskId: task.id }).all(),
    ).toHaveLength(0);
    expect(
      await db.orm.public.Notification.where({
        projectId: project.id,
        userId: memberUser.id,
        type: "PROJECT_MEMBER_REMOVED",
      }).all(),
    ).toHaveLength(0);
  });

  it("should roll back membership removal and unassignment when the transaction fails", async () => {
    const owner = await createTestUser("remove-rollback-owner");
    const memberUser = await createTestUser("remove-rollback-member");
    const project = await createTestProject(owner.id);
    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: memberUser.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });
    const task = await db.orm.public.Task.create({
      title: "[TEST] Rollback removal assignment",
      description: "Transaction rollback test",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
      assigneeId: memberUser.id,
    });

    vi.spyOn(notificationService, "createNotificationWithClient")
      .mockRejectedValueOnce(new Error("Simulated notification failure"));

    await expect(
      removeProjectMember(project.id, memberUser.id, owner.id),
    ).rejects.toThrow("Simulated notification failure");

    const membership = await db.orm.public.ProjectMember.where({
      projectId: project.id,
      userId: memberUser.id,
    }).first();
    expect(membership?.removedAt).toBeNull();
    expect(
      (await db.orm.public.Task.where({ id: task.id }).first())?.assigneeId,
    ).toBe(memberUser.id);
    expect(
      await db.orm.public.ProjectMembershipHistory.where({
        projectId: project.id,
        userId: memberUser.id,
        action: "REMOVED",
      }).all(),
    ).toHaveLength(0);
    expect(
      await db.orm.public.TaskAssignmentHistory.where({ taskId: task.id }).all(),
    ).toHaveLength(0);
  });

  it("should re-add a removed member by reactivating the existing row", async () => {
    const owner = await createTestUser("owner");
    const memberUser = await createTestUser("member");

    const project = await createTestProject(owner.id);

    const existingMember = await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: memberUser.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: new Date().toISOString(),
    });

    await db.orm.public.ProjectMembershipHistory.create({
      projectId: project.id,
      userId: memberUser.id,
      action: "JOINED",
      performedById: owner.id,
    });

    await db.orm.public.ProjectMembershipHistory.create({
      projectId: project.id,
      userId: memberUser.id,
      action: "REMOVED",
      performedById: owner.id,
    });

    const result = await addProjectMember(project.id, memberUser.id, owner.id);

    expect(result.id).toBe(existingMember.id);
    expect(result.userId).toBe(memberUser.id);
    expect(result.removedAt).toBeNull();

    const activeMember = await db.orm.public.ProjectMember.where({
      projectId: project.id,
      userId: memberUser.id,
    }).first();

    expect(activeMember?.id).toBe(existingMember.id);
    expect(activeMember?.removedAt).toBeNull();

    const history = await db.orm.public.ProjectMembershipHistory.where({
      projectId: project.id,
      userId: memberUser.id,
    }).all();

    expect(history.some((entry) => entry.action === "REJOINED")).toBe(true);
  });

  it("should reject an already active member", async () => {
    const owner = await createTestUser("owner-active");
    const memberUser = await createTestUser("member-active");

    const project = await createTestProject(owner.id);

    const member = await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: memberUser.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });

    await expect(
      addProjectMember(project.id, memberUser.id, owner.id),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "User is already a member",
    });

    const members = await db.orm.public.ProjectMember.where({
      projectId: project.id,
      userId: memberUser.id,
    }).all();

    expect(members).toHaveLength(1);
    expect(members[0].id).toBe(member.id);
    expect(members[0].removedAt).toBeNull();
  });

  it("should preserve the unique projectId/userId constraint", async () => {
    const owner = await createTestUser("owner-unique");
    const memberUser = await createTestUser("member-unique");

    const project = await createTestProject(owner.id);

    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: memberUser.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: new Date().toISOString(),
    });

    await addProjectMember(project.id, memberUser.id, owner.id);

    const members = await db.orm.public.ProjectMember.where({
      projectId: project.id,
      userId: memberUser.id,
    }).all();

    expect(members).toHaveLength(1);
    expect(members[0].removedAt).toBeNull();
  });

  it("should rollback member reactivation when an error occurs inside the transaction", async () => {
    const owner = await createTestUser("owner-rollback");
    const memberUser = await createTestUser("member-rollback");

    const project = await createTestProject(owner.id);

    const removedAt = new Date().toISOString();

    const member = await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: memberUser.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt,
    });

    await expect(
      db.transaction(async (tx) => {
        await tx.orm.public.ProjectMember.where({
          id: member.id,
        }).update({
          removedAt: null,
        });

        throw new Error("Simulated transaction failure");
      }),
    ).rejects.toThrow("Simulated transaction failure");

    const memberAfterFailure = await db.orm.public.ProjectMember.where({
      id: member.id,
    }).first();

    expect(memberAfterFailure?.removedAt).toBeTruthy();

    expect(new Date(memberAfterFailure!.removedAt!).getTime()).toBe(
      new Date(removedAt).getTime(),
    );
  });
});
