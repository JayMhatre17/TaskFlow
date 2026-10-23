import { ApiError } from "../errors/api.error";
import { db } from "../prisma/db";
import { createNotificationWithClient } from "./notification.service";
import { getProjectAccess } from "./projectAccess.service";
import { not, or } from "@prisma/orm-postgres/orm-client";

const PROJECT_MEMBER_SEARCH_LIMIT = 10;

export const searchProjectMemberCandidates = async (
  projectId: number,
  query: string,
  ownerId: number,
) => {
  const access = await getProjectAccess(projectId, ownerId);

  if (!access) {
    throw new ApiError(404, "Project not found");
  }

  if (access.role !== "OWNER") {
    throw new ApiError(403, "Only the project owner can search for members");
  }

  const activeMembers = await db.orm.public.ProjectMember.where({
    projectId,
    removedAt: null,
  }).all();
  const excludedIds = [access.project.ownerId, ...activeMembers.map(({ userId }) => userId)];
  const escapedQuery = query.trim().replace(/[\\%_]/g, "\\$&");
  const searchPattern = `%${escapedQuery}%`;

  const users = await db.orm.public.User.where((user) =>
    or(
      user.name.ilike(searchPattern),
      user.email.ilike(searchPattern),
    ),
  )
    .where({ status: "ACTIVE" })
    .where((user) => not(user.id.in(excludedIds)))
    .orderBy((user) => user.name.asc())
    .limit(PROJECT_MEMBER_SEARCH_LIMIT)
    .all();

  return users.map(({ id, name, email }) => ({ id, name, email }));
};

export const getProjectMembers = async (projectId: number, userId: number) => {
  const access = await getProjectAccess(projectId, userId);

  if (!access) {
    return null;
  }
  const members = await db.orm.public.ProjectMember.where({
    projectId,
    removedAt: null,
  }).all();

  const memberIds = [...new Set(members.map((member) => member.userId))];
  const users = memberIds.length
    ? await db.orm.public.User.select("id", "name", "email", "status")
        .where((user) => user.id.in(memberIds))
        .all()
    : [];
  const usersById = new Map(users.map((user) => [user.id, user]));

  return members.map((member) => {
    const user = usersById.get(member.userId);
    const identityAvailable = user && user.status !== "DELETED";

    return {
      userId: member.userId,
      name: identityAvailable ? user.name : undefined,
      email: identityAvailable ? user.email : undefined,
      joinedAt: member.joinedAt,
    };
  });
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
    const removedAt = new Date().toISOString();
    const removedMember = await tx.orm.public.ProjectMember.where({
      id: member.id,
      removedAt: null,
    }).update({
      removedAt,
    });

    if (!removedMember) {
      throw new ApiError(404, "Project member not found");
    }

    const assignedTasks = await tx.orm.public.Task.where({
      projectId,
      assigneeId: userId,
    }).all();

    for (const task of assignedTasks) {
      const unassignedTask = await tx.orm.public.Task.where({
        id: task.id,
        projectId,
        assigneeId: userId,
      }).update({
        assigneeId: null,
      });

      if (!unassignedTask) {
        continue;
      }

      await tx.orm.public.TaskAssignmentHistory.create({
        taskId: task.id,
        previousAssigneeId: userId,
        newAssigneeId: null,
        performedById: removedById,
        action: "UNASSIGNED",
        reason: "Project member removed",
      });
    }

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
