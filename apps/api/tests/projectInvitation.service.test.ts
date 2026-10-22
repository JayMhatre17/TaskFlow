import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";

import { db } from "../src/prisma/db";
import { createUser } from "../src/service/auth.service";
import {
  acceptProjectInvitation,
  cancelProjectInvitation,
  createProjectInvitation,
  getMyProjectInvitations,
  rejectProjectInvitation,
} from "../src/service/projectInvitation.service";

describe("ProjectInvitation service", () => {
  const createdProjectIds: number[] = [];

  const createTestUser = async (suffix: string) => {
    return createUser(
      `Invitation Test ${suffix}`,
      `invitation-${suffix}-${Date.now()}@example.com`,
      "password123",
    );
  };

  const createTestProject = async (ownerId: number) => {
    const { Temporal } = await import("@js-temporal/polyfill");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Invitation Project ${Date.now()}`,
      description: "Project invitation service test",
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
      await db.orm.public.Project.where({
        id: projectId,
      }).delete();
    }

    createdProjectIds.length = 0;
  });

  it("should create a pending invitation for an existing user", async () => {
    const owner = await createTestUser("owner");
    const recipient = await createTestUser("recipient");

    const project = await createTestProject(owner.id);

    const before = Date.now();

    const result = await createProjectInvitation(
      project.id,
      recipient.email,
      owner.id,
    );

    const after = Date.now();

    expect(result.token).toBeTruthy();

    expect(result.invitation).toMatchObject({
      projectId: project.id,
      senderId: owner.id,
      recipientId: recipient.id,
      email: recipient.email.toLowerCase(),
      status: "PENDING",
    });

    expect(result.invitation.tokenHash).not.toBe(result.token);

    const expectedHash = createHash("sha256")
      .update(result.token)
      .digest("hex");

    expect(result.invitation.tokenHash).toBe(expectedHash);

    const expiresAt = new Date(result.invitation.expiresAt).getTime();

    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    expect(expiresAt).toBeGreaterThanOrEqual(before + sevenDays);

    expect(expiresAt).toBeLessThanOrEqual(after + sevenDays);
  });

  it("should create an invitation without a recipientId for an unregistered email", async () => {
    const owner = await createTestUser("owner-unregistered");

    const project = await createTestProject(owner.id);

    const email = `unregistered-${Date.now()}@example.com`;

    const result = await createProjectInvitation(project.id, email, owner.id);

    expect(result.invitation).toMatchObject({
      projectId: project.id,
      senderId: owner.id,
      recipientId: null,
      email,
      status: "PENDING",
    });

    expect(result.token).toBeTruthy();
  });

  it("should reject an invitation from a non-owner", async () => {
    const owner = await createTestUser("owner-non-owner");
    const member = await createTestUser("member-non-owner");
    const recipient = await createTestUser("recipient-non-owner");

    const project = await createTestProject(owner.id);

    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: member.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });

    await expect(
      createProjectInvitation(project.id, recipient.email, member.id),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "Only the project owner can send invitations",
    });
  });

  it("should reject an invitation when the project does not exist", async () => {
    const owner = await createTestUser("owner-missing-project");
    const recipient = await createTestUser("recipient-missing-project");

    await expect(
      createProjectInvitation(999999999, recipient.email, owner.id),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Project not found",
    });
  });

  it("should reject an invitation when the recipient is already a member", async () => {
    const owner = await createTestUser("owner-existing-member");
    const recipient = await createTestUser("existing-member");

    const project = await createTestProject(owner.id);

    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: recipient.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });

    await expect(
      createProjectInvitation(project.id, recipient.email, owner.id),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "User is already a member",
    });
  });

  it("should reject a duplicate pending invitation", async () => {
    const owner = await createTestUser("owner-duplicate");
    const recipient = await createTestUser("recipient-duplicate");

    const project = await createTestProject(owner.id);

    await createProjectInvitation(project.id, recipient.email, owner.id);

    await expect(
      createProjectInvitation(project.id, recipient.email, owner.id),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "A pending invitation already exists for this user",
    });

    const invitations = await db.orm.public.ProjectInvitation.where({
      projectId: project.id,
      email: recipient.email,
      status: "PENDING",
    }).all();

    expect(invitations).toHaveLength(1);
  });

  it("should reject an invitation to the project owner", async () => {
    const owner = await createTestUser("owner-self");

    const project = await createTestProject(owner.id);

    await expect(
      createProjectInvitation(project.id, owner.email, owner.id),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Project owner cannot be invited",
    });
  });

  it("should normalize the invited email", async () => {
    const owner = await createTestUser("owner-normalize");
    const recipient = await createTestUser("recipient-normalize");

    const project = await createTestProject(owner.id);

    const result = await createProjectInvitation(
      project.id,
      `  ${recipient.email.toUpperCase()}  `,
      owner.id,
    );

    expect(result.invitation.email).toBe(recipient.email.toLowerCase());

    expect(result.invitation.recipientId).toBe(recipient.id);
  });
  it("throws 404 when invitation token does not exist", async () => {
    await expect(
      acceptProjectInvitation("invalid-token", 999999999),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Invitation not found",
    });
  });
  it("should accept a valid invitation", async () => {
    const owner = await createTestUser("accept-owner");
    const recipient = await createTestUser("accept-recipient");

    const project = await createTestProject(owner.id);

    const invitationResult = await createProjectInvitation(
      project.id,
      recipient.email,
      owner.id,
    );

    const result = await acceptProjectInvitation(
      invitationResult.token,
      recipient.id,
    );

    expect(result).toMatchObject({
      projectId: project.id,
      userId: recipient.id,
      removedAt: null,
    });

    const invitation = await db.orm.public.ProjectInvitation.where({
      id: invitationResult.invitation.id,
    }).first();

    expect(invitation).toMatchObject({
      recipientId: recipient.id,
      status: "ACCEPTED",
    });

    expect(invitation?.acceptedAt).not.toBeNull();

    const membership = await db.orm.public.ProjectMember.where({
      projectId: project.id,
      userId: recipient.id,
    }).first();

    expect(membership).toMatchObject({
      projectId: project.id,
      userId: recipient.id,
      removedAt: null,
    });

    const history = await db.orm.public.ProjectMembershipHistory.where({
      projectId: project.id,
      userId: recipient.id,
      action: "JOINED",
    }).first();

    expect(history).not.toBeNull();
  });
  it("should reject an invitation for a soft-deleted project without creating membership", async () => {
    const owner = await createTestUser("deleted-project-owner");
    const recipient = await createTestUser("deleted-project-recipient");

    const project = await createTestProject(owner.id);

    const invitationResult = await createProjectInvitation(
      project.id,
      recipient.email,
      owner.id,
    );

    await db.orm.public.Project.where({ id: project.id }).update({
      deletedAt: new Date().toISOString(),
    });

    await expect(
      acceptProjectInvitation(invitationResult.token, recipient.id),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Project not found",
    });

    const membership = await db.orm.public.ProjectMember.where({
      projectId: project.id,
      userId: recipient.id,
    }).first();
    const invitation = await db.orm.public.ProjectInvitation.where({
      id: invitationResult.invitation.id,
    }).first();

    expect(membership).toBeNull();
    expect(invitation?.status).toBe("PENDING");
  });
  it("should reject an expired invitation", async () => {
    const owner = await createTestUser("expired-owner");
    const recipient = await createTestUser("expired-recipient");

    const project = await createTestProject(owner.id);

    const invitationResult = await createProjectInvitation(
      project.id,
      recipient.email,
      owner.id,
    );

    await db.orm.public.ProjectInvitation.where({
      id: invitationResult.invitation.id,
    }).update({
      expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
    });

    await expect(
      acceptProjectInvitation(invitationResult.token, recipient.id),
    ).rejects.toMatchObject({
      statusCode: 410,
      message: "Invitation has expired",
    });

    const member = await db.orm.public.ProjectMember.where({
      projectId: project.id,
      userId: recipient.id,
    }).first();

    expect(member).toBeNull();
  });
  it("should reject an invitation when the registered recipient is different", async () => {
    const owner = await createTestUser("wrong-recipient-owner");
    const recipient = await createTestUser("wrong-recipient");
    const otherUser = await createTestUser("wrong-recipient-other");

    const project = await createTestProject(owner.id);

    const invitationResult = await createProjectInvitation(
      project.id,
      recipient.email,
      owner.id,
    );

    await expect(
      acceptProjectInvitation(invitationResult.token, otherUser.id),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "This invitation is not for this user",
    });

    const member = await db.orm.public.ProjectMember.where({
      projectId: project.id,
      userId: otherUser.id,
    }).first();

    expect(member).toBeNull();
  });
  it("should allow an unregistered-email invitation to be accepted by the matching user", async () => {
    const owner = await createTestUser("unregistered-owner");

    const project = await createTestProject(owner.id);

    const invitedEmail = `future-user-${Date.now()}@example.com`;

    const invitationResult = await createProjectInvitation(
      project.id,
      invitedEmail,
      owner.id,
    );

    expect(invitationResult.invitation.recipientId).toBeNull();

    const recipient = await createUser(
      "Future User",
      invitedEmail,
      "password123",
    );

    const result = await acceptProjectInvitation(
      invitationResult.token,
      recipient.id,
    );

    expect(result).toMatchObject({
      projectId: project.id,
      userId: recipient.id,
      removedAt: null,
    });

    const invitation = await db.orm.public.ProjectInvitation.where({
      id: invitationResult.invitation.id,
    }).first();

    expect(invitation).toMatchObject({
      recipientId: recipient.id,
      status: "ACCEPTED",
    });

    const membership = await db.orm.public.ProjectMember.where({
      projectId: project.id,
      userId: recipient.id,
    }).first();

    expect(membership).not.toBeNull();
  });
  it("should reject an unregistered-email invitation when the user's email does not match", async () => {
    const owner = await createTestUser("unregistered-wrong-owner");

    const project = await createTestProject(owner.id);

    const invitedEmail = `invited-${Date.now()}@example.com`;

    const invitationResult = await createProjectInvitation(
      project.id,
      invitedEmail,
      owner.id,
    );

    expect(invitationResult.invitation.recipientId).toBeNull();

    const wrongUser = await createTestUser("unregistered-wrong-user");

    await expect(
      acceptProjectInvitation(invitationResult.token, wrongUser.id),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "This invitation is not for this user",
    });

    const member = await db.orm.public.ProjectMember.where({
      projectId: project.id,
      userId: wrongUser.id,
    }).first();

    expect(member).toBeNull();
  });
  it("should reject an invitation when the user is already an active member", async () => {
    const owner = await createTestUser("already-member-owner");
    const recipient = await createTestUser("already-member-recipient");

    const project = await createTestProject(owner.id);

    const invitationResult = await createProjectInvitation(
      project.id,
      recipient.email,
      owner.id,
    );

    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: recipient.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });

    await expect(
      acceptProjectInvitation(invitationResult.token, recipient.id),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "User is already a member",
    });

    const invitation = await db.orm.public.ProjectInvitation.where({
      id: invitationResult.invitation.id,
    }).first();

    expect(invitation?.status).toBe("PENDING");
  });
  it("should create JOINED membership history when invitation is accepted", async () => {
    const owner = await createTestUser("history-owner");
    const recipient = await createTestUser("history-recipient");

    const project = await createTestProject(owner.id);

    const invitationResult = await createProjectInvitation(
      project.id,
      recipient.email,
      owner.id,
    );

    await acceptProjectInvitation(invitationResult.token, recipient.id);

    const history = await db.orm.public.ProjectMembershipHistory.where({
      projectId: project.id,
      userId: recipient.id,
      action: "JOINED",
    }).first();

    expect(history).toMatchObject({
      projectId: project.id,
      userId: recipient.id,
      action: "JOINED",
      performedById: recipient.id,
    });
  });
  it("should reject an invitation that has already been accepted", async () => {
    const owner = await createTestUser("accepted-owner");
    const recipient = await createTestUser("accepted-recipient");

    const project = await createTestProject(owner.id);

    const invitationResult = await createProjectInvitation(
      project.id,
      recipient.email,
      owner.id,
    );

    await acceptProjectInvitation(invitationResult.token, recipient.id);

    await expect(
      acceptProjectInvitation(invitationResult.token, recipient.id),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Invitation is no longer pending",
    });
  });
  it("should reject an invitation that has already been rejected", async () => {
    const owner = await createTestUser("rejected-owner");
    const recipient = await createTestUser("rejected-recipient");

    const project = await createTestProject(owner.id);

    const invitationResult = await createProjectInvitation(
      project.id,
      recipient.email,
      owner.id,
    );

    await db.orm.public.ProjectInvitation.where({
      id: invitationResult.invitation.id,
    }).update({
      status: "REJECTED",
      rejectedAt: new Date().toISOString(),
    });

    await expect(
      acceptProjectInvitation(invitationResult.token, recipient.id),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Invitation is no longer pending",
    });
  });
  it("should reject an invitation that has been cancelled", async () => {
    const owner = await createTestUser("cancelled-owner");
    const recipient = await createTestUser("cancelled-recipient");

    const project = await createTestProject(owner.id);

    const invitationResult = await createProjectInvitation(
      project.id,
      recipient.email,
      owner.id,
    );

    await db.orm.public.ProjectInvitation.where({
      id: invitationResult.invitation.id,
    }).update({
      status: "CANCELLED",
      cancelledAt: new Date().toISOString(),
    });

    await expect(
      acceptProjectInvitation(invitationResult.token, recipient.id),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Invitation is no longer pending",
    });
  });
  it("should reject a pending invitation", async () => {
    const owner = await createTestUser("reject-owner");
    const recipient = await createTestUser("reject-recipient");

    const project = await createTestProject(owner.id);

    const invitationResult = await createProjectInvitation(
      project.id,
      recipient.email,
      owner.id,
    );

    const result = await rejectProjectInvitation(
      invitationResult.token,
      recipient.id,
    );

    expect(result).toMatchObject({
      id: invitationResult.invitation.id,
      status: "REJECTED",
    });

    expect(result?.rejectedAt).not.toBeNull();
  });
  it("should reject an invalid invitation token", async () => {
    const user = await createTestUser("reject-invalid-token");

    await expect(
      rejectProjectInvitation("invalid-token", user.id),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Invitation not found",
    });
  });
  it("should reject an invitation that is no longer pending", async () => {
    const owner = await createTestUser("reject-not-pending-owner");
    const recipient = await createTestUser("reject-not-pending-recipient");

    const project = await createTestProject(owner.id);

    const invitationResult = await createProjectInvitation(
      project.id,
      recipient.email,
      owner.id,
    );

    await db.orm.public.ProjectInvitation.where({
      id: invitationResult.invitation.id,
    }).update({
      status: "ACCEPTED",
      acceptedAt: new Date().toISOString(),
    });

    await expect(
      rejectProjectInvitation(invitationResult.token, recipient.id),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Invitation is no longer pending",
    });
  });
  it("should reject an expired invitation without changing its pending status", async () => {
    const owner = await createTestUser("reject-expired-owner");
    const recipient = await createTestUser("reject-expired-recipient");
    const project = await createTestProject(owner.id);
    const invitationResult = await createProjectInvitation(
      project.id,
      recipient.email,
      owner.id,
    );

    await db.orm.public.ProjectInvitation.where({
      id: invitationResult.invitation.id,
    }).update({
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    });

    await expect(
      rejectProjectInvitation(invitationResult.token, recipient.id),
    ).rejects.toMatchObject({
      statusCode: 410,
      message: "Invitation has expired",
    });

    const invitation = await db.orm.public.ProjectInvitation.where({
      id: invitationResult.invitation.id,
    }).first();
    expect(invitation?.status).toBe("PENDING");
  });
  it("allows only one concurrent accept or reject action", async () => {
    const owner = await createTestUser("concurrent-action-owner");
    const recipient = await createTestUser("concurrent-action-recipient");
    const project = await createTestProject(owner.id);
    const invitationResult = await createProjectInvitation(
      project.id,
      recipient.email,
      owner.id,
    );

    const results = await Promise.allSettled([
      acceptProjectInvitation(invitationResult.token, recipient.id),
      rejectProjectInvitation(invitationResult.token, recipient.id),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(
      1,
    );
    const rejectedResult = results.find(
      (result) => result.status === "rejected",
    );
    expect(rejectedResult).toMatchObject({
      status: "rejected",
      reason: { statusCode: 409 },
    });

    const invitation = await db.orm.public.ProjectInvitation.where({
      id: invitationResult.invitation.id,
    }).first();
    const membership = await db.orm.public.ProjectMember.where({
      projectId: project.id,
      userId: recipient.id,
      removedAt: null,
    }).first();

    expect(["ACCEPTED", "REJECTED"]).toContain(invitation?.status);
    expect(Boolean(membership)).toBe(invitation?.status === "ACCEPTED");
  });
  it("should reject when a different registered user tries to reject the invitation", async () => {
    const owner = await createTestUser("reject-wrong-owner");
    const recipient = await createTestUser("reject-wrong-recipient");
    const otherUser = await createTestUser("reject-wrong-other");

    const project = await createTestProject(owner.id);

    const invitationResult = await createProjectInvitation(
      project.id,
      recipient.email,
      owner.id,
    );

    await expect(
      rejectProjectInvitation(invitationResult.token, otherUser.id),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "This invitation is not for this user",
    });

    const invitation = await db.orm.public.ProjectInvitation.where({
      id: invitationResult.invitation.id,
    }).first();

    expect(invitation?.status).toBe("PENDING");
  });
  it("should allow the matching user to reject an invitation with no recipientId", async () => {
    const owner = await createTestUser("reject-unregistered-owner");

    const project = await createTestProject(owner.id);

    const invitedEmail = `reject-future-${Date.now()}@example.com`;

    const invitationResult = await createProjectInvitation(
      project.id,
      invitedEmail,
      owner.id,
    );

    expect(invitationResult.invitation.recipientId).toBeNull();

    const recipient = await createUser(
      "Reject Future User",
      invitedEmail,
      "password123",
    );

    const result = await rejectProjectInvitation(
      invitationResult.token,
      recipient.id,
    );

    expect(result).toMatchObject({
      id: invitationResult.invitation.id,
      status: "REJECTED",
    });

    expect(result?.rejectedAt).not.toBeNull();

    await expect(
      rejectProjectInvitation(invitationResult.token, recipient.id),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Invitation is no longer pending",
    });
  });
  it("should reject when the user's email does not match an unregistered invitation", async () => {
    const owner = await createTestUser("reject-email-owner");

    const project = await createTestProject(owner.id);

    const invitedEmail = `reject-invited-${Date.now()}@example.com`;

    const invitationResult = await createProjectInvitation(
      project.id,
      invitedEmail,
      owner.id,
    );

    const wrongUser = await createTestUser("reject-email-wrong-user");

    await expect(
      rejectProjectInvitation(invitationResult.token, wrongUser.id),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "This invitation is not for this user",
    });

    const invitation = await db.orm.public.ProjectInvitation.where({
      id: invitationResult.invitation.id,
    }).first();

    expect(invitation?.status).toBe("PENDING");
  });
  it("should allow the project owner to cancel a pending invitation", async () => {
    const owner = await createTestUser("cancel-owner");
    const recipient = await createTestUser("cancel-recipient");

    const project = await createTestProject(owner.id);

    const invitationResult = await createProjectInvitation(
      project.id,
      recipient.email,
      owner.id,
    );

    const result = await cancelProjectInvitation(
      invitationResult.invitation.id,
      owner.id,
      project.id,
    );

    expect(result).toMatchObject({
      id: invitationResult.invitation.id,
      projectId: project.id,
      status: "CANCELLED",
    });

    expect(result?.cancelledAt).not.toBeNull();
  });
  it("should reject cancellation by a non-owner", async () => {
    const owner = await createTestUser("cancel-non-owner");
    const member = await createTestUser("cancel-member");
    const recipient = await createTestUser("cancel-recipient");

    const project = await createTestProject(owner.id);

    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: member.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });

    const invitationResult = await createProjectInvitation(
      project.id,
      recipient.email,
      owner.id,
    );

    await expect(
      cancelProjectInvitation(
        invitationResult.invitation.id,
        member.id,
        project.id,
      ),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "Only the project owner can cancel invitations",
    });
  });
  it("should reject cancellation when the invitation does not exist", async () => {
    const owner = await createTestUser("cancel-missing");

    await expect(
      cancelProjectInvitation(999999999, owner.id, 999999999),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Invitation not found",
    });
  });
  it("should reject cancellation of an invitation that is no longer pending", async () => {
    const owner = await createTestUser("cancel-accepted-owner");
    const recipient = await createTestUser("cancel-accepted-recipient");

    const project = await createTestProject(owner.id);

    const invitationResult = await createProjectInvitation(
      project.id,
      recipient.email,
      owner.id,
    );

    await db.orm.public.ProjectInvitation.where({
      id: invitationResult.invitation.id,
    }).update({
      status: "ACCEPTED",
      acceptedAt: new Date().toISOString(),
    });

    await expect(
      cancelProjectInvitation(
        invitationResult.invitation.id,
        owner.id,
        project.id,
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Only pending invitations can be cancelled",
    });
  });
  it("should reject cancellation of a rejected invitation", async () => {
    const owner = await createTestUser("cancel-rejected-owner");
    const recipient = await createTestUser("cancel-rejected-recipient");

    const project = await createTestProject(owner.id);

    const invitationResult = await createProjectInvitation(
      project.id,
      recipient.email,
      owner.id,
    );

    await db.orm.public.ProjectInvitation.where({
      id: invitationResult.invitation.id,
    }).update({
      status: "REJECTED",
      rejectedAt: new Date().toISOString(),
    });

    await expect(
      cancelProjectInvitation(
        invitationResult.invitation.id,
        owner.id,
        project.id,
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Only pending invitations can be cancelled",
    });
  });
  it("should reject cancellation of an already cancelled invitation", async () => {
    const owner = await createTestUser("cancel-again-owner");
    const recipient = await createTestUser("cancel-again-recipient");

    const project = await createTestProject(owner.id);

    const invitationResult = await createProjectInvitation(
      project.id,
      recipient.email,
      owner.id,
    );

    await cancelProjectInvitation(
      invitationResult.invitation.id,
      owner.id,
      project.id,
    );

    await expect(
      cancelProjectInvitation(
        invitationResult.invitation.id,
        owner.id,
        project.id,
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Only pending invitations can be cancelled",
    });
  });
  it("should return invitations received by the user", async () => {
    const owner = await createTestUser("list-owner");
    const recipient = await createTestUser("list-recipient");

    const project = await createTestProject(owner.id);

    await createProjectInvitation(project.id, recipient.email, owner.id);

    const invitations = await getMyProjectInvitations(recipient.id);

    expect(invitations).toHaveLength(1);

    expect(invitations[0]).toMatchObject({
      projectId: project.id,
      senderId: owner.id,
      recipientId: recipient.id,
      email: recipient.email.toLowerCase(),
      status: "PENDING",
    });
  });
  it("should return an invitation when the user registers after the invitation was created", async () => {
    const owner = await createTestUser("list-later-owner");

    const project = await createTestProject(owner.id);

    const email = `list-later-${Date.now()}@example.com`;

    const invitationResult = await createProjectInvitation(
      project.id,
      email,
      owner.id,
    );

    expect(invitationResult.invitation.recipientId).toBeNull();

    const recipient = await createUser(
      "Later Registered User",
      email,
      "password123",
    );

    const invitations = await getMyProjectInvitations(recipient.id);

    expect(invitations).toHaveLength(1);

    expect(invitations[0]).toMatchObject({
      id: invitationResult.invitation.id,
      projectId: project.id,
      email,
      recipientId: null,
      status: "PENDING",
    });
  });
  it("should not return invitations belonging to another user", async () => {
    const owner = await createTestUser("list-unrelated-owner");
    const recipient = await createTestUser("list-unrelated-recipient");
    const unrelatedUser = await createTestUser("list-unrelated-user");

    const project = await createTestProject(owner.id);

    await createProjectInvitation(project.id, recipient.email, owner.id);

    const invitations = await getMyProjectInvitations(unrelatedUser.id);

    expect(invitations).toHaveLength(0);
  });
  it("should return multiple invitations received by the user", async () => {
    const owner1 = await createTestUser("list-multiple-owner-1");
    const owner2 = await createTestUser("list-multiple-owner-2");
    const recipient = await createTestUser("list-multiple-recipient");

    const project1 = await createTestProject(owner1.id);
    const project2 = await createTestProject(owner2.id);

    await createProjectInvitation(project1.id, recipient.email, owner1.id);

    await createProjectInvitation(project2.id, recipient.email, owner2.id);

    const invitations = await getMyProjectInvitations(recipient.id);

    expect(invitations).toHaveLength(2);

    expect(invitations.map((invitation) => invitation.projectId)).toEqual(
      expect.arrayContaining([project1.id, project2.id]),
    );
  });
});
