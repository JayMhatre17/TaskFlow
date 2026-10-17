import { Temporal } from "@js-temporal/polyfill";
import { db } from "../prisma/db";
import {
  CreateProjectInput,
  ProjectQueryInput,
  UpdateProjectInput,
} from "../schema/project.schema";
import { or } from "@prisma/orm-postgres/orm-client";
import { applyProjectSorting } from "./projects/projectQuery.utils";
import { ApiError } from "../errors/api.error";

const toActivityValue = (value: unknown): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  return String(value);
};

export const getProjects = async (query: ProjectQueryInput, userId: number) => {
  let projectQuery = db.orm.public.Project.where({
    ownerId: userId,
    deletedAt: null,
  });

  if (query.status) {
    projectQuery = projectQuery.where({
      status: query.status,
    });
  }

  if (query.search) {
    projectQuery = projectQuery.where((p) =>
      or(
        p.name.ilike(`%${query.search}%`),
        p.description.ilike(`%${query.search}%`),
      ),
    );
  }

  const offset = (query.page - 1) * query.limit;

  const total = await projectQuery.aggregate((agg) => ({
    total: agg.count(),
  }));

  const orderedProjectQuery = applyProjectSorting(
    projectQuery,
    query.sortBy,
    query.sortOrder,
  );

  const projects = await orderedProjectQuery
    .offset(offset)
    .limit(query.limit)
    .all();

  const totalPages = Math.ceil(total.total / query.limit);

  return {
    data: projects,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: total.total,
      totalPages,
    },
  };
};
export const getProjectById = async (id: number, userId: number) => {
  return db.orm.public.Project.first({
    id,
    ownerId: userId,
    deletedAt: null,
  });
};

export const createProject = async (
  data: CreateProjectInput,
  ownerId: number,
) => {
  return db.transaction(async (tx) => {
    const project = await tx.orm.public.Project.create({
      name: data.name,
      description: data.description,
      status: data.status,
      startDate: Temporal.Instant.from(`${data.startDate}T00:00:00Z`),
      dueDate: Temporal.Instant.from(`${data.dueDate}T00:00:00Z`),
      ownerId,
    });
    await tx.orm.public.ProjectActivity.create({
      projectId: project.id,
      actorId: ownerId,
      action: "CREATED",
      field: null,
      oldValue: null,
      newValue: null,
      description: `Project "${project.name}" was created`,
    });
    return project;
  });
};

export const updateProject = async (
  id: number,
  data: UpdateProjectInput,
  userId: number,
) => {
  return db.transaction(async (tx) => {
    const project = await tx.orm.public.Project.where({
      id,
      ownerId: userId,
      deletedAt: null,
    }).first();
    if (!project) {
      throw new ApiError(404, "Project not found");
    }
    const updateData = {
      ...(data.name !== undefined && {
        name: data.name,
      }),

      ...(data.description !== undefined && {
        description: data.description,
      }),

      ...(data.status !== undefined && {
        status: data.status,
      }),

      ...(data.startDate !== undefined && {
        startDate: Temporal.Instant.from(`${data.startDate}T00:00:00Z`),
      }),

      ...(data.dueDate !== undefined && {
        dueDate: Temporal.Instant.from(`${data.dueDate}T00:00:00Z`),
      }),
    };
    const changes = [
      { field: "name", oldValue: project.name, newValue: updateData.name },
      {
        field: "description",
        oldValue: project.description,
        newValue: updateData.description,
      },
      {
        field: "status",
        oldValue: project.status,
        newValue: updateData.status,
      },
      {
        field: "startDate",
        oldValue: project.startDate,
        newValue: updateData.startDate,
      },
      {
        field: "dueDate",
        oldValue: project.dueDate,
        newValue: updateData.dueDate,
      },
    ].filter((change) => change.newValue !== undefined);

    const updatedProject = await tx.orm.public.Project.where({
      id,
      ownerId: userId,
      deletedAt: null,
    }).update(updateData);

    if (!updatedProject) {
      return null;
    }

    for (const change of changes) {
      await tx.orm.public.ProjectActivity.create({
        projectId: id,
        actorId: userId,
        action: "UPDATED",
        field: change.field,
        oldValue: toActivityValue(change.oldValue),
        newValue: toActivityValue(change.newValue),
        description: `Project ${change.field} was updated`,
      });
    }

    return updatedProject;
  });
};
export const deleteProject = async (id: number, userId: number) => {
  return db.transaction(async (tx) => {
    const project = await tx.orm.public.Project.where({
      id,
      ownerId: userId,
      deletedAt: null,
    }).first();
    if (!project) {
      throw new ApiError(404, "Project not found");
    }
    const now = Temporal.Now.instant();
    const scheduledDeletionAt = now.add({
      seconds: 90 * 24 * 60 * 60,
    });

    const deletedProject = await tx.orm.public.Project.where({
      id,
      ownerId: userId,
      deletedAt: null,
    }).update({
      deletedAt: now.toString(),
      deletedById: userId,
      scheduledDeletionAt: scheduledDeletionAt.toString(),
    });

    if (!deletedProject) {
      return null;
    }

    await tx.orm.public.ProjectActivity.create({
      projectId: id,
      actorId: userId,
      action: "DELETED",
      field: null,
      oldValue: null,
      newValue: null,
      description: `Project "${project.name}" was moved to the deletion queue`,
    });

    return deletedProject;
  });
};

export const getProjectOptions = async (userId: number) => {
  const projects = await db.orm.public.Project.where({
    ownerId: userId,
    deletedAt: null,
  }).all();

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
  }));
};

export const restoreProject = async (id: number, userId: number) => {
  return db.transaction(async (tx) => {
    // Find the project, including soft-deleted projects.
    // Only the project owner can restore it.
    const project = await tx.orm.public.Project.where({
      id,
      ownerId: userId,
    }).first();

    // Project doesn't exist, or the user isn't its owner.
    if (!project) {
      return null;
    }

    // Only restore projects that are currently deleted.
    if (project.deletedAt === null) {
      return null;
    }

    // Restore the project and clear its deletion metadata.
    const restoredProject = await tx.orm.public.Project.where({
      id,
      ownerId: userId,
    }).update({
      deletedAt: null,
      deletedById: null,
      scheduledDeletionAt: null,
    });

    if (!restoredProject) {
      return null;
    }

    // Record restoration in the same transaction.
    await tx.orm.public.ProjectActivity.create({
      projectId: id,
      actorId: userId,
      action: "RESTORED",
      field: null,
      oldValue: "deleted",
      newValue: "active",
      description: `Project "${project.name}" was restored`,
    });

    return restoredProject;
  });
};
