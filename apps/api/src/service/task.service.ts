import { Temporal } from "@js-temporal/polyfill";
import { db } from "../prisma/db";
import {
  CreateTaskInput,
  TaskQueryInput,
  UpdateTaskInput,
} from "../schema/task.schema";
import { or } from "@prisma/orm-postgres/orm-client";
import { applyTaskSorting } from "./tasks/taskQuery.utils";
import {
  getTaskPriorityLabel,
  getTaskStatusLabel,
  TASK_PRIORITY,
  TASK_STATUS,
} from "../constants/task.constants";
import { ApiError } from "../errors/api.error";
type Task = Awaited<ReturnType<typeof db.orm.public.Task.first>>;

type TaskRecord = NonNullable<Task>;
const sortColumn = {
  title: "title",
  status: "status",
  priority: "priority",
  dueDate: "dueDate",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
} as const;
export const getTasks = async (query: TaskQueryInput) => {
  const offset = (query.page - 1) * query.limit;
  let taskQuery = db.orm.public.Task;
  const projects = await db.orm.public.Project.all();

  if (query.status) {
    taskQuery = taskQuery.where({
      status: TASK_STATUS[query.status],
    });
  }
  if (query.priority) {
    taskQuery = taskQuery.where({
      priority: TASK_PRIORITY[query.priority],
    });
  }
  if (query.projectId) {
    taskQuery = taskQuery.where({
      projectId: query.projectId,
    });
  }
  if (query.search) {
    taskQuery = taskQuery.where((t) =>
      or(
        t.title.ilike(`%${query.search}%`),
        t.description.ilike(`%${query.search}%`),
      ),
    );
  }
  const orderedTaskQuery = applyTaskSorting(
    taskQuery,
    query.sortBy,
    query.sortOrder,
  );
  const tasks = await orderedTaskQuery.offset(offset).limit(query.limit).all();
  const total = await taskQuery.aggregate((agg) => ({
    total: agg.count(),
  }));

  const totalPages = Math.ceil(total.total / query.limit);

  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const tasksWithProjectDetails = tasks.map((task) => ({
    ...task,
    status: getTaskStatusLabel(task.status),
    priority: getTaskPriorityLabel(task.priority),
    project: projectMap.get(task.projectId)
      ? {
          id: projectMap.get(task.projectId)!.id,
          name: projectMap.get(task.projectId)!.name,
        }
      : null,
  }));
  return {
    data: tasksWithProjectDetails,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: total.total,
      totalPages,
    },
  };
};

export const getTaskById = async (id: number) => {
  const task = await db.orm.public.Task.first({
    id,
  });

  return attachProject(task);
};

export const createTask = async (data: CreateTaskInput) => {
  const project = await db.orm.public.Project.first({
    id: data.projectId,
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const task = await db.orm.public.Task.create({
    title: data.title,
    description: data.description,
    status: TASK_STATUS[data.status],
    priority: TASK_PRIORITY[data.priority],
    dueDate:
      data.dueDate !== undefined
        ? Temporal.Instant.from(`${data.dueDate}T00:00:00Z`)
        : undefined,
    projectId: data.projectId,
  });

  return mapTaskFromDb(task);
};

export const updateTask = async (id: number, data: UpdateTaskInput) => {
  if (data.projectId !== undefined) {
    const project = await db.orm.public.Project.first({
      id: data.projectId,
    });

    if (!project) {
      throw new ApiError(404, "Project not found");
    }
  }
  const updateData = {
    ...(data.title !== undefined && {
      title: data.title,
    }),

    ...(data.description !== undefined && {
      description: data.description,
    }),

    ...(data.status !== undefined && {
      status: TASK_STATUS[data.status],
    }),

    ...(data.priority !== undefined && {
      priority: TASK_PRIORITY[data.priority],
    }),

    ...(data.dueDate !== undefined && {
      dueDate: Temporal.Instant.from(`${data.dueDate}T00:00:00Z`),
    }),

    ...(data.projectId !== undefined && {
      projectId: data.projectId,
    }),
  };

  const task = await db.orm.public.Task.where({ id }).update(updateData);

  return mapTaskFromDb(task);
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

  const tasks = await db.orm.public.Task.where({
    projectId,
  }).all();

  return tasks.map(mapTaskFromDb);
};
const attachProject = async (task: TaskRecord | null) => {
  if (!task) {
    return null;
  }

  const project = await db.orm.public.Project.first({
    id: task.projectId,
  });

  return {
    ...mapTaskFromDb(task),
    project: project
      ? {
          id: project.id,
          name: project.name,
        }
      : null,
  };
};

const mapTaskFromDb = (task: TaskRecord) => {
  if (!task) {
    return null;
  }

  return {
    ...task,
    status: getTaskStatusLabel(task.status),
    priority: getTaskPriorityLabel(task.priority),
  };
};
