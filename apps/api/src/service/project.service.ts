import { Temporal } from "@js-temporal/polyfill";
import { db } from "../prisma/db";
import {
  CreateProjectInput,
  ProjectQueryInput,
  UpdateProjectInput,
} from "../schema/project.schema";
import { or } from "@prisma/orm-postgres/orm-client";
import { applyProjectSorting } from "./projects/projectQuery.utils";

export const getProjects = async (query: ProjectQueryInput) => {
  let projectQuery = db.orm.public.Project;

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

  return db.orm.public.Project.where({ id }).update(updateData);
};

export const deleteProject = async (id: number) => {
  return db.orm.public.Project.where({ id }).delete();
};

export const getProjectOptions = async () => {
  const projects = await db.orm.public.Project.all();

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
  }));
};
