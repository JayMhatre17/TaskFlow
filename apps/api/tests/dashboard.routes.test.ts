import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { Temporal } from "@js-temporal/polyfill";
import app from "../src/app";
import { db } from "../src/prisma/db";
import { createUser } from "../src/service/auth.service";
import { createSession } from "../src/service/session.service";
import { authenticatedRequestWithSession } from "./helpers/auth.helper";

describe("Dashboard summary API", () => {
  const users: { id: number; sessionId: string }[] = [];
  const projectIds: number[] = [];
  const taskIds: number[] = [];
  let dashboardUser: { id: number; api: ReturnType<typeof authenticatedRequestWithSession> };
  let emptyUser: { id: number; api: ReturnType<typeof authenticatedRequestWithSession> };
  let activeOwnedProjectId: number;
  let memberProjectId: number;
  let deletedProjectId: number;
  let inaccessibleProjectId: number;

  const makeUser = async (label: string) => {
    const user = await createUser(
      label,
      `dashboard-${label.toLowerCase().replaceAll(" ", "-")}-${Date.now()}-${Math.random()}@example.com`,
      "TestPassword123!",
    );
    const session = await createSession(user.id);
    users.push({ id: user.id, sessionId: session.id });
    return { id: user.id, api: authenticatedRequestWithSession(session.id) };
  };

  const makeProject = async (ownerId: number, name: string, status = "Active") => {
    const project = await db.orm.public.Project.create({
      name,
      description: `Description for ${name}`,
      status,
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId,
    });
    projectIds.push(project.id);
    return project;
  };

  const makeTask = async (
    projectId: number,
    creatorId: number,
    title: string,
    status: number,
    dueDate?: Temporal.Instant,
  ) => {
    const task = await db.orm.public.Task.create({
      title,
      description: null,
      status,
      priority: 2,
      projectId,
      creatorId,
      ...(dueDate && { dueDate }),
    });
    taskIds.push(task.id);
    return task;
  };

  beforeAll(async () => {
    dashboardUser = await makeUser("Dashboard User");
    emptyUser = await makeUser("Empty Dashboard User");
    const otherOwner = await makeUser("Other Project Owner");

    const activeOwned = await makeProject(dashboardUser.id, "Owned active project");
    activeOwnedProjectId = activeOwned.id;
    const onHoldOwned = await makeProject(dashboardUser.id, "Owned on hold project", "On Hold");
    const memberProject = await makeProject(otherOwner.id, "Member project");
    memberProjectId = memberProject.id;
    const deletedProject = await makeProject(dashboardUser.id, "Deleted project");
    deletedProjectId = deletedProject.id;
    const inaccessibleProject = await makeProject(otherOwner.id, "Inaccessible project");
    inaccessibleProjectId = inaccessibleProject.id;
    const removedMemberProject = await makeProject(otherOwner.id, "Removed member project");

    await db.orm.public.ProjectMember.create({
      projectId: memberProjectId,
      userId: dashboardUser.id,
      addedById: otherOwner.id,
    });
    await db.orm.public.ProjectMember.create({
      projectId: removedMemberProject.id,
      userId: dashboardUser.id,
      addedById: otherOwner.id,
      removedAt: Temporal.Now.instant().toString(),
    });

    await makeTask(activeOwnedProjectId, dashboardUser.id, "Owned todo", 1);
    await makeTask(activeOwnedProjectId, dashboardUser.id, "Owned in progress", 2);
    await makeTask(activeOwnedProjectId, dashboardUser.id, "Owned in review", 3);
    const completedTask = await makeTask(activeOwnedProjectId, dashboardUser.id, "Owned complete", 4);
    const yesterday = Temporal.PlainDate.from(
      Temporal.Now.instant().toString().slice(0, 10),
    ).subtract({ days: 1 });
    const overdueTask = await makeTask(
      activeOwnedProjectId,
      dashboardUser.id,
      "Owned overdue",
      1,
      Temporal.Instant.from(`${yesterday.toString()}T00:00:00Z`),
    );
    await makeTask(memberProjectId, otherOwner.id, "Member task", 1);
    await makeTask(onHoldOwned.id, dashboardUser.id, "On hold project task", 1);
    const deletedTask = await makeTask(activeOwnedProjectId, dashboardUser.id, "Deleted task", 1);
    await db.orm.public.Task.where({ id: deletedTask.id }).update({
      deletedAt: Temporal.Now.instant().toString(),
      deletedById: dashboardUser.id,
    });
    const taskUnderDeletedProject = await makeTask(
      deletedProjectId,
      dashboardUser.id,
      "Task under deleted project",
      1,
    );
    await makeTask(inaccessibleProjectId, otherOwner.id, "Inaccessible task", 1);
    await makeTask(removedMemberProject.id, otherOwner.id, "Removed member task", 1);

    await db.orm.public.Project.where({ id: deletedProjectId }).update({
      deletedAt: Temporal.Now.instant().toString(),
      deletedById: dashboardUser.id,
    });

    await db.orm.public.ProjectActivity.create({
      projectId: activeOwnedProjectId,
      actorId: dashboardUser.id,
      action: "UPDATED",
      field: "status",
      oldValue: "On Hold",
      newValue: "Active",
      description: "Owned project was updated",
    });
    await db.orm.public.ProjectActivity.create({
      projectId: inaccessibleProjectId,
      actorId: otherOwner.id,
      action: "UPDATED",
      field: "status",
      oldValue: "On Hold",
      newValue: "Active",
      description: "Inaccessible project was updated",
    });
    await db.orm.public.TaskActivity.create({
      taskId: completedTask.id,
      actorId: dashboardUser.id,
      action: "STATUS_CHANGED",
      description: "Owned task was completed",
    });
    await db.orm.public.TaskActivity.create({
      taskId: deletedTask.id,
      actorId: dashboardUser.id,
      action: "UPDATED",
      description: "Deleted task activity",
    });
    await db.orm.public.TaskActivity.create({
      taskId: taskUnderDeletedProject.id,
      actorId: dashboardUser.id,
      action: "UPDATED",
      description: "Deleted parent activity",
    });
  });

  afterAll(async () => {
    for (const taskId of taskIds) {
      await db.orm.public.TaskActivity.where({ taskId }).deleteAll();
      await db.orm.public.TaskComment.where({ taskId }).deleteAll();
      await db.orm.public.TaskAssignmentHistory.where({ taskId }).deleteAll();
      await db.orm.public.Task.where({ id: taskId }).deleteAll();
    }
    for (const projectId of projectIds) {
      await db.orm.public.ProjectActivity.where({ projectId }).deleteAll();
      await db.orm.public.ProjectMembershipHistory.where({ projectId }).deleteAll();
      await db.orm.public.ProjectMember.where({ projectId }).deleteAll();
      await db.orm.public.Project.where({ id: projectId }).deleteAll();
    }
    for (const user of users) {
      await db.orm.public.Session.where({ id: user.sessionId }).deleteAll();
    }
    for (const user of users) {
      await db.orm.public.User.where({ id: user.id }).deleteAll();
    }
  });

  it("aggregates accurate stats and scopes recent records to owned and active member projects", async () => {
    const response = await dashboardUser.api.get("/api/dashboard/summary");

    expect(response.status).toBe(200);
    expect(response.body.stats).toEqual({
      activeProjects: 2,
      openTasks: 6,
      completedTasks: 1,
      overdueTasks: 1,
    });
    expect(response.body.taskStatusCounts).toEqual({
      todo: 4,
      inProgress: 1,
      inReview: 1,
      completed: 1,
    });
    const projectNames = response.body.recentProjects.map((project: { name: string }) => project.name);
    expect(projectNames).toContain("Owned active project");
    expect(projectNames).toContain("Member project");
    expect(projectNames).not.toContain("Deleted project");
    expect(projectNames).not.toContain("Inaccessible project");
    expect(projectNames).not.toContain("Removed member project");

    const taskTitles = response.body.recentTasks.map((task: { title: string }) => task.title);
    expect(taskTitles).toContain("Member task");
    expect(taskTitles).not.toContain("Deleted task");
    expect(taskTitles).not.toContain("Task under deleted project");
    expect(taskTitles).not.toContain("Inaccessible task");
    expect(taskTitles).not.toContain("Removed member task");

    const activityDescriptions = response.body.recentActivity.map(
      (activity: { description: string }) => activity.description,
    );
    expect(activityDescriptions).toContain("Owned project was updated");
    expect(activityDescriptions).not.toContain("Inaccessible project was updated");
    expect(activityDescriptions).not.toContain("Deleted task activity");
    expect(activityDescriptions).not.toContain("Deleted parent activity");
    const ownedActivity = response.body.recentActivity.find(
      (activity: { description: string }) =>
        activity.description === "Owned project was updated",
    );
    expect(ownedActivity.actor).toEqual({
      id: dashboardUser.id,
      name: "Dashboard User",
    });
  });

  it("returns zero counts and empty lists when the user has no accessible projects", async () => {
    const response = await emptyUser.api.get("/api/dashboard/summary");

    expect(response.status).toBe(200);
    expect(response.body.stats).toEqual({
      activeProjects: 0,
      openTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
    });
    expect(response.body.taskStatusCounts).toEqual({
      todo: 0,
      inProgress: 0,
      inReview: 0,
      completed: 0,
    });
    expect(response.body.recentProjects).toEqual([]);
    expect(response.body.recentTasks).toEqual([]);
    expect(response.body.recentActivity).toEqual([]);
  });

  it("requires authentication", async () => {
    expect((await request(app).get("/api/dashboard/summary")).status).toBe(401);
  });
});
