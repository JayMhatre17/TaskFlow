import { createHash } from "node:crypto";
import { ApiError } from "../errors/api.error";
import { db } from "../prisma/db";
import { generateInvitaionToken } from "../utils/invitationToken";
import { getUserByEmail } from "./auth.service";
import { getProjectAccess } from "./projectAccess.service";
import { or } from "@prisma/orm-postgres/orm-client";
import { createNotificationWithClient } from "./notification.service";

const INVITATION_DURATION_DAYS = 7;

export const createProjectInvitation = async (
  projectId: number,
  email: string,
  senderId: number,
) => {
  const access = await getProjectAccess(projectId, senderId);

  if (!access) {
    throw new ApiError(404, "Project not found");
  }

  if (access.role !== "OWNER") {
    throw new ApiError(403, "Only the project owner can send invitations");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const recipient = await getUserByEmail(normalizedEmail);

  if (recipient && recipient.id === access.project.ownerId) {
    throw new ApiError(400, "Project owner cannot be invited");
  }

  if (recipient) {
    const existingMember = await db.orm.public.ProjectMember.where({
      projectId,
      userId: recipient.id,
      removedAt: null,
    }).first();

    if (existingMember) {
      throw new ApiError(409, "User is already a member");
    }
  }

  const existingInvitation = await db.orm.public.ProjectInvitation.where({
    projectId,
    email: normalizedEmail,
    status: "PENDING",
  }).first();

  if (existingInvitation) {
    throw new ApiError(
      409,
      "A pending invitation already exists for this user",
    );
  }

  const { token, tokenHash } = generateInvitaionToken();

  const expiresAt = new Date(
    Date.now() + INVITATION_DURATION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const invitation = await db.transaction(async (tx) => {
    const createdInvitation = await tx.orm.public.ProjectInvitation.create({
      projectId,
      senderId,
      recipientId: recipient?.id ?? null,
      email: normalizedEmail,
      tokenHash,
      status: "PENDING",
      expiresAt,
    });

    // Only registered users can receive in-app notifications.
    if (recipient) {
      await createNotificationWithClient(tx, {
        userId: recipient.id,
        type: "PROJECT_INVITATION",
        title: "Project invitation",
        message: `You have been invited to join the project "${access.project.name}".`,
        projectId,
      });
    }

    return createdInvitation;
  });

  return {
    invitation,
    token,
  };
};

export const acceptProjectInvitation = async (
  token: string,
  userId: number,
) => {
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const invitation = await db.orm.public.ProjectInvitation.where({
    tokenHash,
  }).first();

  if (!invitation) {
    throw new ApiError(404, "Invitation not found");
  }

  if (invitation.status !== "PENDING") {
    throw new ApiError(409, "Invitation is no longer pending");
  }

  if (new Date(invitation.expiresAt).getTime() <= Date.now()) {
    throw new ApiError(410, "Invitation has expired");
  }

  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (invitation.recipientId !== null) {
    if (invitation.recipientId !== userId) {
      throw new ApiError(403, "This invitation is not for this user");
    }
  } else if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new ApiError(403, "This invitation is not for this user");
  }

  return db.transaction(async (tx) => {
    const existingMember = await tx.orm.public.ProjectMember.where({
      projectId: invitation.projectId,
      userId,
      removedAt: null,
    }).first();

    if (existingMember) {
      throw new ApiError(409, "User is already a member");
    }

    const project = await tx.orm.public.Project.where({
      id: invitation.projectId,
    }).first();

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const member = await tx.orm.public.ProjectMember.create({
      projectId: invitation.projectId,
      userId,
      addedById: invitation.senderId,
      joinedAt: new Date().toISOString(),
    });

    await tx.orm.public.ProjectInvitation.where({
      id: invitation.id,
    }).update({
      recipientId: userId,
      status: "ACCEPTED",
      acceptedAt: new Date().toISOString(),
    });

    await tx.orm.public.ProjectMembershipHistory.create({
      projectId: invitation.projectId,
      userId,
      action: "JOINED",
      performedById: userId,
    });

    // Notify the current project owner, but never notify the actor.
    if (project.ownerId !== userId) {
      await createNotificationWithClient(tx, {
        userId: project.ownerId,
        type: "PROJECT_INVITATION_ACCEPTED",
        title: "Project invitation accepted",
        message: `${user.name} accepted the invitation to join "${project.name}".`,
        projectId: invitation.projectId,
      });
    }

    return member;
  });
};

export const rejectProjectInvitation = async (
  token: string,
  userId: number,
) => {
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const invitation = await db.orm.public.ProjectInvitation.where({
    tokenHash,
  }).first();

  if (!invitation) {
    throw new ApiError(404, "Invitation not found");
  }

  if (invitation.status !== "PENDING") {
    throw new ApiError(409, "Invitation is no longer pending");
  }

  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (invitation.recipientId !== null) {
    if (invitation.recipientId !== userId) {
      throw new ApiError(403, "This invitation is not for this user");
    }
  } else {
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ApiError(403, "This invitation is not for this user");
    }
  }

  const rejectedAt = new Date().toISOString();

  return db.orm.public.ProjectInvitation.where({
    id: invitation.id,
  }).update({
    status: "REJECTED",
    rejectedAt,
  });
};

export const cancelProjectInvitation = async (
  invitationId: number,
  ownerId: number,
  projectId: number,
) => {
  const invitation = await db.orm.public.ProjectInvitation.where({
    id: invitationId,
    projectId,
  }).first();

  if (!invitation) {
    throw new ApiError(404, "Invitation not found");
  }

  const access = await getProjectAccess(invitation.projectId, ownerId);

  if (!access) {
    throw new ApiError(404, "Project not found");
  }

  if (access.role !== "OWNER") {
    throw new ApiError(403, "Only the project owner can cancel invitations");
  }

  if (invitation.status !== "PENDING") {
    throw new ApiError(409, "Only pending invitations can be cancelled");
  }

  const cancelledAt = new Date().toISOString();

  return db.orm.public.ProjectInvitation.where({
    id: invitation.id,
  }).update({
    status: "CANCELLED",
    cancelledAt,
  });
};

export const getMyProjectInvitations = async (userId: number) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const invitations = await db.orm.public.ProjectInvitation.where(
    (invitation) =>
      or(
        invitation.recipientId.eq(userId),
        invitation.email.eq(user.email.toLowerCase()),
      ),
  ).all();

  return invitations;
};
