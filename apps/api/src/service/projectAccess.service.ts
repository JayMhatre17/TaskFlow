import { db } from "../prisma/db";

export const getProjectAccess = async (projectId: number, userId: number) => {
  // 1. Check whether the project exists.
  const project = await db.orm.public.Project.where({
    id: projectId,
    deletedAt: null,
  }).first();

  if (!project) {
    return null;
  }
  // 2. Check whether the user owns the project.
  if (project.ownerId === userId) {
    return {
      project,
      role: "OWNER" as const,
    };
  }

  // 3. Check whether the user is an active member.
  const membership = await db.orm.public.ProjectMember.where({
    projectId,
    userId,
    removedAt: null,
  }).first();

  if (membership) {
    return {
      project,
      role: "MEMBER" as const,
    };
  }

  return null;
};
