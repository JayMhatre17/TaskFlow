import { Temporal } from "@js-temporal/polyfill";
import { ApiError } from "../errors/api.error";
import { db } from "../prisma/db";
import { getProjectAccess } from "./projectAccess.service";

type ProjectActivityAction =
  "CREATED" | "UPDATED" | "OWNER_CHANGED" | "DELETED" | "RESTORED";

type CreateProjectActivityInput = {
  projectId: number;
  actorId?: number | null;
  action: ProjectActivityAction;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  description?: string | null;
};

export const createProjectActivity = async (
  data: CreateProjectActivityInput,
) => {
  const project = await db.orm.public.Project.where({
    id: data.projectId,
  }).first();

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (data.actorId != null) {
    const actor = await db.orm.public.User.where({
      id: data.actorId,
    }).first();

    if (!actor) {
      throw new ApiError(404, "Project activity actor not found");
    }
  }

  return db.orm.public.ProjectActivity.create({
    projectId: data.projectId,
    actorId: data.actorId,
    action: data.action,
    field: data.field,
    oldValue: data.oldValue,
    newValue: data.newValue,
    description: data.description,
  });
};

export const getProjectActivities = async (
  projectId: number,
  userId: number,
) => {
  const access = await getProjectAccess(projectId, userId);

  if (!access) {
    throw new ApiError(404, "Project not found");
  }

  const activities = await db.orm.public.ProjectActivity.where({
    projectId,
  }).all();

  return activities.sort((a, b) =>
    Temporal.Instant.compare(
      Temporal.Instant.from(b.createdAt),
      Temporal.Instant.from(a.createdAt),
    ),
  );
};
