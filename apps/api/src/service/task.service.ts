import { Temporal } from "@js-temporal/polyfill";
import { db } from "../prisma/db";
import {
  AssignTaskInput,
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
import { getProjectAccess } from "./projectAccess.service";
import { createNotificationWithClient } from "./notification.service";
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

export const getTasks = async (query: TaskQueryInput, userId: number) => {
  const offset = (query.page - 1) * query.limit;
  const ownedProjects = await db.orm.public.Project.where({
    ownerId: userId,
  }).all();

  const membership = await db.orm.public.ProjectMember.where({
    userId,
    removedAt: null,
  }).all();

  const projectIds = [
    ...ownedProjects.map((project) => project.id),
    ...membership.map((membership) => membership.projectId),
  ];

  const uniqueProjectIds = [...new Set(projectIds)];

  if (uniqueProjectIds.length === 0) {
    return {
      data: [],
      pagination: {
        page: query.page,
        limit: query.limit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  const projects = await db.orm.public.Project.where((project) =>
    or(...uniqueProjectIds.map((projectId) => project.id.eq(projectId))),
  )
    .where({ deletedAt: null })
    .all();

  const activeProjectIds = projects.map((project) => project.id);

  if (activeProjectIds.length === 0) {
    return {
      data: [],
      pagination: {
        page: query.page,
        limit: query.limit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  let taskQuery = db.orm.public.Task.where((task) =>
    or(...activeProjectIds.map((projectId) => task.projectId.eq(projectId))),
  );

  taskQuery = taskQuery.where({ deletedAt: null });

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
  const assignees = await getTaskAssignees(tasks);
  const tasksWithProjectDetails = tasks.map((task) => ({
    ...mapTaskWithAssignee(task, assignees),
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

export const getDeletedTasks = async (userId: number) => {
  const projects = await db.orm.public.Project.where({ ownerId: userId }).all();
  if (projects.length === 0) return [];

  const projectMap = new Map(
    projects.map((project) => [project.id, project]),
  );
  const allTasks = await db.orm.public.Task.where((task) =>
    task.projectId.in(projects.map((project) => project.id)),
  ).all();
  const deletedTasks = allTasks
    .filter((task) => task.deletedAt !== null)
    .sort((a, b) => String(b.deletedAt).localeCompare(String(a.deletedAt)));
  return deletedTasks.map((task) => {
    const project = projectMap.get(task.projectId)!;
    const safeTask = mapTaskFromDb(task)!;
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: safeTask.status,
      priority: safeTask.priority,
      dueDate: task.dueDate,
      deletedAt: task.deletedAt,
      project: {
        id: project.id,
        name: project.name,
        deletedAt: project.deletedAt,
      },
    };
  });
};

export const getTaskById = async (id: number, userId: number) => {
  const tasks = await db.orm.public.Task.where({
    id,
    deletedAt: null,
  }).all();
  const task = tasks[0];
  if (!task || task.deletedAt !== null) {
    return null;
  }
  const access = await getProjectAccess(task.projectId, userId);

  if (!access) {
    return null;
  }
  return attachProject(task);
};

export const createTask = async (data: CreateTaskInput, userId: number) => {
  const access = await getProjectAccess(data.projectId, userId);

  if (!access) {
    throw new ApiError(404, "Project not found");
  }

  const task = await db.transaction(async (tx) => {
    const task = await tx.orm.public.Task.create({
      title: data.title,
      description: data.description,
      status: TASK_STATUS[data.status],
      priority: TASK_PRIORITY[data.priority],
      dueDate:
        data.dueDate !== undefined
          ? Temporal.Instant.from(`${data.dueDate}T00:00:00Z`)
          : undefined,
      projectId: data.projectId,
      creatorId: userId,
    });
    await tx.orm.public.TaskActivity.create({
      taskId: task.id,
      actorId: userId,
      action: "CREATED",
      description: "Created task",
    });
    return task;
  });

  return attachAssigneeSummary(task);
};

export const updateTask = async (
  id: number,
  data: UpdateTaskInput,
  userId: number,
) => {
  const existingTask = await db.orm.public.Task.where({ id }).first();

  // Reject missing or soft-deleted tasks.
  if (!existingTask || existingTask.deletedAt !== null) {
    return null;
  }

  const access = await getProjectAccess(existingTask.projectId, userId);

  if (!access) {
    return null;
  }

  if (data.projectId !== undefined) {
    const targetAccess = await getProjectAccess(data.projectId, userId);

    if (!targetAccess) {
      return null;
    }
  }

  const updateData = {
    ...(data.title !== undefined && { title: data.title }),
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

  const toActivityValue = (value: unknown): string | null =>
    value == null ? null : String(value);

  const activityEntries: {
    action:
      "UPDATED" | "STATUS_CHANGED" | "PRIORITY_CHANGED" | "DUE_DATE_CHANGED";
    field: string;
    oldValue: string | null;
    newValue: string | null;
  }[] = [];

  if (data.title !== undefined && existingTask.title !== data.title) {
    activityEntries.push({
      action: "UPDATED",
      field: "title",
      oldValue: existingTask.title,
      newValue: data.title,
    });
  }

  if (
    data.description !== undefined &&
    existingTask.description !== data.description
  ) {
    activityEntries.push({
      action: "UPDATED",
      field: "description",
      oldValue: existingTask.description,
      newValue: data.description,
    });
  }

  if (
    data.status !== undefined &&
    existingTask.status !== TASK_STATUS[data.status]
  ) {
    activityEntries.push({
      action: "STATUS_CHANGED",
      field: "status",
      oldValue: getTaskStatusLabel(existingTask.status),
      newValue: getTaskStatusLabel(TASK_STATUS[data.status]),
    });
  }

  if (
    data.priority !== undefined &&
    existingTask.priority !== TASK_PRIORITY[data.priority]
  ) {
    activityEntries.push({
      action: "PRIORITY_CHANGED",
      field: "priority",
      oldValue: getTaskPriorityLabel(existingTask.priority),
      newValue: getTaskPriorityLabel(TASK_PRIORITY[data.priority]),
    });
  }

  if (data.dueDate !== undefined) {
    const oldDueDate =
      existingTask.dueDate == null
        ? null
        : Temporal.Instant.from(String(existingTask.dueDate))
            .toString()
            .slice(0, 10);

    const newDueDate = data.dueDate;

    if (oldDueDate !== newDueDate) {
      activityEntries.push({
        action: "DUE_DATE_CHANGED",
        field: "dueDate",
        oldValue: oldDueDate,
        newValue: newDueDate,
      });
    }
  }

  if (
    data.projectId !== undefined &&
    existingTask.projectId !== data.projectId
  ) {
    activityEntries.push({
      action: "UPDATED",
      field: "projectId",
      oldValue: String(existingTask.projectId),
      newValue: String(data.projectId),
    });
  }

  const updatedTask = await db.transaction(async (tx) => {
    // Recheck the task's active state as part of the update.
    const updatedTask = await tx.orm.public.Task.where({
      id,
      projectId: existingTask.projectId,
      deletedAt: null,
    }).update(updateData);

    if (!updatedTask) {
      return null;
    }

    for (const entry of activityEntries) {
      await tx.orm.public.TaskActivity.create({
        taskId: id,
        actorId: userId,
        action: entry.action,
        field: entry.field,
        oldValue: entry.oldValue,
        newValue: entry.newValue,
        description: `Changed ${entry.field}`,
      });
    }

    const statusChange = activityEntries.find(
      (entry) => entry.action === "STATUS_CHANGED",
    );

    if (statusChange) {
      const projectId = data.projectId ?? existingTask.projectId;

      const project = await tx.orm.public.Project.where({
        id: projectId,
      }).first();

      if (project) {
        const recipientIds = new Set<number>();

        if (existingTask.assigneeId !== null) {
          recipientIds.add(existingTask.assigneeId);
        }

        recipientIds.add(project.ownerId);
        recipientIds.delete(userId);

        for (const recipientId of recipientIds) {
          await createNotificationWithClient(tx, {
            userId: recipientId,
            type: "TASK_STATUS_CHANGED",
            title: "Task status updated",
            message: `Task "${existingTask.title}" status changed from ${statusChange.oldValue} to ${statusChange.newValue}.`,
            taskId: id,
            projectId,
          });
        }
      }
    }

    return updatedTask;
  });

  return updatedTask ? attachAssigneeSummary(updatedTask) : null;
};

export const deleteTask = async (id: number, userId: number) => {
  const task = await db.orm.public.Task.where({ id }).first();

  if (!task || task.deletedAt !== null) {
    return false;
  }

  const project = await getOwnedProject(task.projectId, userId);

  if (!project) {
    return false;
  }
  return db.transaction(async (tx) => {
    const deletedAt = Temporal.Now.instant().toString();
    const updatedTask = await tx.orm.public.Task.where({
      id,
      projectId: project.id,
      deletedAt: null,
    }).update({
      deletedAt,
      deletedById: userId,
    });
    if (!updatedTask) {
      return false;
    }
    await tx.orm.public.TaskActivity.create({
      taskId: id,
      actorId: userId,
      action: "DELETED",
      description: "Deleted task",
    });
    return true;
  });
};

export const getTasksByProjectId = async (
  projectId: number,
  userId: number,
) => {
  const access = await getProjectAccess(projectId, userId);

  if (!access) {
    return null;
  }

  const tasks = await db.orm.public.Task.where({
    projectId,
    deletedAt: null,
  }).all();

  const assignees = await getTaskAssignees(tasks);

  return tasks.map((task) => ({
    ...mapTaskWithAssignee(task, assignees),
    project: {
      id: access.project.id,
      name: access.project.name,
    },
  }));
};

const attachProject = async (task: TaskRecord | null) => {
  if (!task) {
    return null;
  }

  const project = await db.orm.public.Project.first({
    id: task.projectId,
  });
  const assignees = await getTaskAssignees([task]);

  return {
    ...mapTaskWithAssignee(task, assignees),
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

type TaskAssigneeSummary = {
  id: number;
  name: string;
  email: string;
};

const getTaskAssignees = async (tasks: TaskRecord[]) => {
  const assigneeIds = [
    ...new Set(
      tasks.flatMap((task) =>
        task.assigneeId === null ? [] : [task.assigneeId],
      ),
    ),
  ];

  if (assigneeIds.length === 0) {
    return new Map<number, TaskAssigneeSummary>();
  }

  const users = await db.orm.public.User.select(
    "id",
    "name",
    "email",
    "status",
  )
    .where((user) => user.id.in(assigneeIds))
    .all();

  return new Map<number, TaskAssigneeSummary>(
    users
      .filter((user) => user.status !== "DELETED")
      .map(({ id, name, email }) => [id, { id, name, email }]),
  );
};

const mapTaskWithAssignee = (
  task: TaskRecord,
  assignees: Map<number, TaskAssigneeSummary>,
) => ({
  ...mapTaskFromDb(task),
  assignee:
    task.assigneeId === null ? null : (assignees.get(task.assigneeId) ?? null),
});

const attachAssigneeSummary = async (task: TaskRecord) => {
  const assignees = await getTaskAssignees([task]);
  return mapTaskWithAssignee(task, assignees);
};

const getOwnedProject = async (projectId: number, userId: number) => {
  const projects = await db.orm.public.Project.where({
    id: projectId,
    ownerId: userId,
  }).all();

  return projects[0] ?? null;
};

export const assignTask = async (
  taskId: number,
  data: AssignTaskInput,
  userId: number,
) => {
  const task = await db.orm.public.Task.where({ id: taskId }).first();

  if (!task || task.deletedAt !== null) {
    throw new ApiError(404, "Task not found");
  }

  const access = await getProjectAccess(task.projectId, userId);

  if (!access) {
    throw new ApiError(404, "Task not found");
  }

  if (data.assigneeId !== null) {
    const project = await db.orm.public.Project.where({
      id: task.projectId,
    }).first();

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const assignee = await db.orm.public.User.where({
      id: data.assigneeId,
    }).first();

    if (!assignee) {
      throw new ApiError(400, "Assignee not found");
    }

    if (assignee.status !== "ACTIVE") {
      throw new ApiError(400, "Assignee must have an active account");
    }

    const isOwner = project.ownerId === data.assigneeId;

    const membership = await db.orm.public.ProjectMember.where({
      projectId: task.projectId,
      userId: data.assigneeId,
      removedAt: null,
    }).first();

    if (!isOwner && !membership) {
      throw new ApiError(
        400,
        "Task can only be assigned to the project owner or an active project member",
      );
    }
  }

  const previousAssigneeId = task.assigneeId;
  const newAssigneeId = data.assigneeId;

  if (previousAssigneeId === newAssigneeId) {
    return attachAssigneeSummary(task);
  }

  let action: "ASSIGNED" | "REASSIGNED" | "UNASSIGNED";

  if (previousAssigneeId === null && newAssigneeId !== null) {
    action = "ASSIGNED";
  } else if (previousAssigneeId !== null && newAssigneeId === null) {
    action = "UNASSIGNED";
  } else {
    action = "REASSIGNED";
  }

  const updatedTask = await db.transaction(async (tx) => {
    const updatePlan = tx.sql.public.task
      .update({ assigneeId: newAssigneeId })
      .where((fields, operators) => operators.eq(fields.id, taskId))
      .where((fields, operators) => operators.eq(fields.deletedAt, null))
      .where((fields, operators) =>
        previousAssigneeId === null
          ? operators.eq(fields.assigneeId, null)
          : operators.eq(fields.assigneeId, previousAssigneeId),
      )
      .returning("id")
      .build();
    const updatedRows = await tx.query(updatePlan);

    if (updatedRows.length === 0) {
      throw new ApiError(409, "Task assignment changed; refresh and try again");
    }

    const updatedTask = await tx.orm.public.Task.where({ id: taskId }).first();

    await tx.orm.public.TaskAssignmentHistory.create({
      taskId,
      previousAssigneeId,
      newAssigneeId,
      performedById: userId,
      action,
      reason: data.reason,
    });

    if (previousAssigneeId !== newAssigneeId && newAssigneeId !== null) {
      await createNotificationWithClient(tx, {
        userId: newAssigneeId,
        type: previousAssigneeId === null ? "TASK_ASSIGNED" : "TASK_REASSIGNED",
        title:
          previousAssigneeId === null
            ? "Task assigned to you"
            : "Task reassigned to you",
        message: `You have been ${previousAssigneeId === null ? "assigned" : "reassigned"} a task :${task.title}`,
        taskId,
        projectId: task.projectId,
      });
    }
    if (previousAssigneeId !== null && newAssigneeId === null) {
      await createNotificationWithClient(tx, {
        userId: previousAssigneeId,
        type: "TASK_UNASSIGNED",
        title: "Task unassigned",
        message: `You have been unassigned from task: ${task.title}`,
        taskId,
        projectId: task.projectId,
      });
    }
    return updatedTask;
  });

  return updatedTask ? attachAssigneeSummary(updatedTask) : null;
};

export const restoreTask = async (id: number, userId: number) => {
  const task = await db.orm.public.Task.where({ id }).first();

  if (!task || task.deletedAt === null) {
    return false;
  }

  // Restoration is only available to the owner while the parent project is active.
  const access = await getProjectAccess(task.projectId, userId);

  if (!access || access.role !== "OWNER") {
    return false;
  }

  const project = access.project;

  return db.transaction(async (tx) => {
    const restoredTask = await tx.orm.public.Task.where({
      id,
      projectId: project.id,
      deletedAt: task.deletedAt,
    }).update({
      deletedAt: null,
      deletedById: null,
      scheduledDeletionAt: null,
    });
    if (!restoredTask) {
      return false;
    }
    await tx.orm.public.TaskActivity.create({
      taskId: id,
      actorId: userId,
      action: "RESTORED",
      description: "Restored task",
    });

    return true;
  });
};

export const getTaskActivities = async (taskId: number, userId: number) => {
  const task = await db.orm.public.Task.where({ id: taskId }).first();

  if (!task || task.deletedAt !== null) {
    throw new ApiError(404, "Task not found");
  }

  const access = await getProjectAccess(task.projectId, userId);

  if (!access) {
    throw new ApiError(404, "Task not found");
  }

  const activities = await db.orm.public.TaskActivity.where({
    taskId,
  }).all();

  const actorIds = [
    ...new Set(
      activities.flatMap((activity) =>
        activity.actorId === null ? [] : [activity.actorId],
      ),
    ),
  ];
  const actors = actorIds.length
    ? await db.orm.public.User.select("id", "name", "email", "status")
        .where((user) => user.id.in(actorIds))
        .all()
    : [];
  const actorSummaries = new Map(
    actors
      .filter((actor) => actor.status !== "DELETED")
      .map(({ id, name, email }) => [id, { id, name, email }]),
  );

  return activities
    .map((activity) => ({
      ...activity,
      actor:
        activity.actorId === null
          ? null
          : (actorSummaries.get(activity.actorId) ?? null),
    }))
    .sort((a, b) =>
    Temporal.Instant.compare(
      Temporal.Instant.from(b.createdAt),
      Temporal.Instant.from(a.createdAt),
    ),
  );
};
