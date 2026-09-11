import { Temporal } from "@js-temporal/polyfill";
import { db } from "../prisma/db";
import { CreateTaskInput, UpdateTaskInput } from "../schema/task.schema";

export const getTasks = async () => {
  return db.orm.public.Task.all();
};

export const getTaskById = async (id: number) => {
  return db.orm.public.Task.first({
    id,
  });
};

export const createTask = async (data: CreateTaskInput) => {
  const project = await db.orm.public.Project.first({ id: data.projectId });
  if (!project) {
    throw new Error("Project not found");
  }

  return db.orm.public.Task.create({
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    dueDate:
      data.dueDate !== undefined
        ? Temporal.Instant.from(`${data.dueDate}T00:00:00Z`)
        : undefined,
    projectId: data.projectId,
  });
};

export const updateTask = async (id: number, data: UpdateTaskInput) => {
  const updateData = {
    ...(data.title !== undefined && {
      title: data.title,
    }),

    ...(data.description !== undefined && {
      description: data.description,
    }),

    ...(data.status !== undefined && {
      status: data.status,
    }),

    ...(data.priority !== undefined && {
      priority: data.priority,
    }),

    ...(data.dueDate !== undefined && {
      dueDate: Temporal.Instant.from(`${data.dueDate}T00:00:00Z`),
    }),

    ...(data.projectId !== undefined && {
      projectId: data.projectId,
    }),
  };

  return db.orm.public.Task.where({ id }).update(updateData);
};

export const deleteTask = async (id: number) => {
  return db.orm.public.Task.where({ id }).delete();
};

export const getTasksByProjectId = async (projectId: number) => {
  const project = await db.orm.public.Project.first({
    id: projectId,
  });

  if (!project) {
    throw new Error("Project not found");
  }

  return db.orm.public.Task.where({
    projectId,
  }).all();
};
