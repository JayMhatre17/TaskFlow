import { afterEach, describe, expect, it, vi } from "vitest";

import { db } from "../src/prisma/db";
import { createUser } from "../src/service/auth.service";
import { addProjectMember } from "../src/service/projectMember.service";
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
