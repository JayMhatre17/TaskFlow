import { Temporal } from "@js-temporal/polyfill";
import { db } from "../prisma/db";
import {
  CreateProjectInput,
  UpdateProjectInput,
} from "../schema/project.schema";

export const getProjects = async () => {
  return db.orm.public.Project.all();
};

export const getProjectById = async (id: number) => {
  return db.orm.public.Project.first({
    id,
  });
};

export const createProject = async (data: CreateProjectInput) => {
  return db.orm.public.Project.create({
    name: data.name,
    description: data.description,
    status: data.status,
    startDate: Temporal.Instant.from(`${data.startDate}T00:00:00Z`),
    dueDate: Temporal.Instant.from(`${data.dueDate}T00:00:00Z`),
  });
};

export const updateProject = async (id: number, data: UpdateProjectInput) => {
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

  return db.orm.public.Project.where({ id }).update(updateData                                                                                  );
};

export const deleteProject = async (id: number) => {
  return db.orm.public.Project.where({ id }).delete();
};
