import { ApiError } from "../errors/api.error";
import { db } from "../prisma/db";
import { createNotificationWithClient } from "./notification.service";
import { getProjectAccess } from "./projectAccess.service";

export const getProjectMembers = async (projectId: number, userId: number) => {
  const access = await getProjectAccess(projectId, userId);

  if (!access) {
    return null;
  }
  const members = await db.orm.public.ProjectMember.where({
    projectId,
    removedAt: null,
  }).all();

  const result = await Promise.all(
    members.map(async (member) => {
      const user = await db.orm.public.User.where({
        id: member.userId,
      }).first();

      return {
        userId: member.userId,
        name: user?.name,
        email: user?.email,
        joinedAt: member.joinedAt,
      };
    }),
  );

  return result;
};

export const addProjectMember = async (
  projectId: number,
  userId: number,
  addedById: number,
) => {
  const access = await getProjectAccess(projectId, addedById);

  if (!access) {
    throw new ApiError(404, "Project not found");
  }

  if (access.role !== "OWNER") {
    throw new ApiError(403, "Only the project owner can add members");
  }

  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.id === access.project.ownerId) {
    throw new ApiError(400, "Project owner is already a member by ownership");
  }

  const existingMember = await db.orm.public.ProjectMember.where({
    projectId,
    userId,
  }).first();

  if (existingMember && !existingMember.removedAt) {
    throw new ApiError(409, "User is already a member");
  }

  const action = existingMember ? "REJOINED" : "JOINED";

  return db.transaction(async (tx) => {
    let member;

    if (existingMember) {
      member = await tx.orm.public.ProjectMember.where({
        id: existingMember.id,
      }).update({
        removedAt: null,
      });
    } else {
      member = await tx.orm.public.ProjectMember.create({
        projectId,
        userId,
        addedById,
        joinedAt: new Date().toISOString(),
      });
    }

    await tx.orm.public.ProjectMembershipHistory.create({
      projectId,
      userId,
      action,
      performedById: addedById,
    });

    await createNotificationWithClient(tx, {
      userId,
      type: "PROJECT_MEMBER_ADDED",
      title: "Added to a project",
      message: `You have been added to the project "${access.project.name}".`,
      projectId,
    });

    return member;
  });
};

export const removeProjectMember = async (
  projectId: number,
  userId: number,
  removedById: number,
) => {
  const access = await getProjectAccess(projectId, removedById);

  if (!access) {
    throw new ApiError(404, "Project not found");
  }

  if (access.role !== "OWNER") {
    throw new ApiError(403, "Only the project owner can remove members");
  }

  const member = await db.orm.public.ProjectMember.where({
    projectId,
    userId,
    removedAt: null,
  }).first();

  if (!member) {
    throw new ApiError(404, "Project member not found");
  }

  return db.transaction(async (tx) => {
    await tx.orm.public.ProjectMember.where({ id: member.id }).update({
      removedAt: new Date().toISOString(),
    });
    await tx.orm.public.ProjectMembershipHistory.create({
      projectId,
      userId,
      action: "REMOVED",
      performedById: removedById,
    });
    await createNotificationWithClient(tx, {
      userId,
      type: "PROJECT_MEMBER_REMOVED",
      title: "Removed from a project",
      message: `You have been removed from the project "${access.project.name}".`,
      projectId,
    });
  });
};
