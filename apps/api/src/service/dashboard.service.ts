import { Temporal } from "@js-temporal/polyfill";
import { or } from "@prisma/orm-postgres/orm-client";
import { TASK_STATUS } from "../constants/task.constants";
import { db } from "../prisma/db";
import { getProjects } from "./project.service";
import { getTasks } from "./task.service";

const RECENT_ITEMS_LIMIT = 5;
const RECENT_ACTIVITY_LIMIT = 10;

export const getDashboardSummary = async (userId: number) => {
  const [ownedProjects, memberships] = await Promise.all([
    db.orm.public.Project.where({ ownerId: userId }).all(),
    db.orm.public.ProjectMember.where({ userId, removedAt: null }).all(),
  ]);
  const projectIds = [
    ...new Set([
      ...ownedProjects.map((project) => project.id),
      ...memberships.map((membership) => membership.projectId),
    ]),
  ];

  const projects = projectIds.length
    ? await db.orm.public.Project.where((project) =>
        or(...projectIds.map((projectId) => project.id.eq(projectId))),
      )
        .where({ deletedAt: null })
        .all()
    : [];
  const activeProjectIds = projects.map((project) => project.id);

  const baseTasks = activeProjectIds.length
    ? db.orm.public.Task.where((task) =>
        task.projectId.in(activeProjectIds),
      ).where({ deletedAt: null })
    : null;

  const countTasks = async (query: typeof db.orm.public.Task) => {
    const result = await query.aggregate((aggregate) => ({
      total: aggregate.count(),
    }));
    return result.total;
  };

  const emptyCounts = {
    todo: 0,
    inProgress: 0,
    inReview: 0,
    completed: 0,
  };
  const [activeProjects, todo, inProgress, inReview, completed, overdue] =
    await Promise.all([
      activeProjectIds.length
        ? db.orm.public.Project.where((project) =>
            or(...activeProjectIds.map((projectId) => project.id.eq(projectId))),
          )
            .where({ status: "Active", deletedAt: null })
            .aggregate((aggregate) => ({ total: aggregate.count() }))
            .then((result) => result.total)
        : Promise.resolve(0),
      baseTasks ? countTasks(baseTasks.where({ status: TASK_STATUS.TODO })) : 0,
      baseTasks
        ? countTasks(baseTasks.where({ status: TASK_STATUS.IN_PROGRESS }))
        : 0,
      baseTasks
        ? countTasks(baseTasks.where({ status: TASK_STATUS.IN_REVIEW }))
        : 0,
      baseTasks
        ? countTasks(baseTasks.where({ status: TASK_STATUS.COMPLETED }))
        : 0,
      baseTasks
        ? countTasks(
            baseTasks
              .where((task) =>
                or(
                  task.status.eq(TASK_STATUS.TODO),
                  task.status.eq(TASK_STATUS.IN_PROGRESS),
                  task.status.eq(TASK_STATUS.IN_REVIEW),
                ),
              )
              .where((task) =>
                task.dueDate.lt(
                  Temporal.Instant.from(
                    `${Temporal.Now.instant().toString().slice(0, 10)}T00:00:00Z`,
                  ),
                ),
              ),
          )
        : 0,
    ]);

  const taskStatusCounts = baseTasks
    ? { todo, inProgress, inReview, completed }
    : emptyCounts;
  const openTasks = todo + inProgress + inReview;

  const [recentProjects, recentTasks, recentActivity] = await Promise.all([
    getProjects(
      {
        page: 1,
        limit: RECENT_ITEMS_LIMIT,
        sortBy: "updatedAt",
        sortOrder: "desc",
      },
      userId,
    ),
    getTasks(
      {
        page: 1,
        limit: RECENT_ITEMS_LIMIT,
        sortBy: "updatedAt",
        sortOrder: "desc",
      },
      userId,
    ),
    getRecentActivity(projects),
  ]);

  return {
    stats: {
      activeProjects,
      openTasks,
      completedTasks: completed,
      overdueTasks: overdue,
    },
    taskStatusCounts,
    recentProjects: recentProjects.data,
    recentTasks: recentTasks.data,
    recentActivity,
  };
};

const getRecentActivity = async (
  projects: Awaited<ReturnType<typeof db.orm.public.Project.all>>,
) => {
  if (projects.length === 0) return [];

  const projectIds = projects.map((project) => project.id);
  const tasks = await db.orm.public.Task.select("id", "title", "projectId")
    .where((task) => task.projectId.in(projectIds))
    .where({ deletedAt: null })
    .all();
  const taskIds = tasks.map((task) => task.id);

  const [projectActivities, taskActivities] = await Promise.all([
    db.orm.public.ProjectActivity.where((activity) =>
      activity.projectId.in(projectIds),
    )
      .orderBy((activity) => activity.createdAt.desc())
      .limit(RECENT_ACTIVITY_LIMIT)
      .all(),
    taskIds.length
      ? db.orm.public.TaskActivity.where((activity) =>
          activity.taskId.in(taskIds),
        )
          .orderBy((activity) => activity.createdAt.desc())
          .limit(RECENT_ACTIVITY_LIMIT)
          .all()
      : Promise.resolve([]),
  ]);

  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  const actorIds = [
    ...new Set(
      [...projectActivities, ...taskActivities].flatMap((activity) =>
        activity.actorId === null ? [] : [activity.actorId],
      ),
    ),
  ];
  const actors = actorIds.length
    ? await db.orm.public.User.select("id", "name", "status")
        .where((user) => user.id.in(actorIds))
        .all()
    : [];
  const actorMap = new Map(
    actors
      .filter((actor) => actor.status !== "DELETED")
      .map(({ id, name }) => [id, { id, name }]),
  );

  const projectEvents = projectActivities.map((activity) => {
    const project = projectMap.get(activity.projectId)!;
    return {
      id: `project-${activity.id}`,
      action: activity.action,
      description: activity.description,
      createdAt: activity.createdAt,
      actor:
        activity.actorId === null
          ? null
          : (actorMap.get(activity.actorId) ?? null),
      project: { id: project.id, name: project.name },
      task: null,
    };
  });
  const taskEvents = taskActivities.flatMap((activity) => {
    const task = taskMap.get(activity.taskId);
    if (!task) return [];
    const project = projectMap.get(task.projectId);
    if (!project) return [];
    return [{
      id: `task-${activity.id}`,
      action: activity.action,
      description: activity.description,
      createdAt: activity.createdAt,
      actor:
        activity.actorId === null
          ? null
          : (actorMap.get(activity.actorId) ?? null),
      project: { id: project.id, name: project.name },
      task: { id: task.id, title: task.title },
    }];
  });

  return [...projectEvents, ...taskEvents]
    .sort((a, b) =>
      Temporal.Instant.compare(
        Temporal.Instant.from(String(b.createdAt)),
        Temporal.Instant.from(String(a.createdAt)),
      ),
    )
    .slice(0, RECENT_ACTIVITY_LIMIT);
};
