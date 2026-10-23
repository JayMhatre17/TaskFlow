import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { Temporal } from "@js-temporal/polyfill";
import app from "../src/app";
import { db } from "../src/prisma/db";
import { createUser } from "../src/service/auth.service";
import { createSession } from "../src/service/session.service";
import { authenticatedRequestWithSession } from "./helpers/auth.helper";

describe("Deleted items API", () => {
  const userIds: number[] = [];
  const sessionIds: string[] = [];
  const projectIds: number[] = [];
  const taskIds: number[] = [];
  let owner: { id: number; api: ReturnType<typeof authenticatedRequestWithSession> };
  let outsider: { id: number; api: ReturnType<typeof authenticatedRequestWithSession> };
  let activeProjectId: number;
  let deletedProjectId: number;
  let deletedTaskId: number;
  let taskUnderDeletedProjectId: number;
  let activeTaskId: number;

  const makeUser = async (label: string) => {
    const user = await createUser(
      label,
      `deleted-items-${label.toLowerCase().replaceAll(" ", "-")}-${Date.now()}-${Math.random()}@example.com`,
      "TestPassword123!",
    );
    const session = await createSession(user.id);
    userIds.push(user.id);
    sessionIds.push(session.id);
    return { id: user.id, api: authenticatedRequestWithSession(session.id) };
  };

  const makeProject = async (ownerId: number, name: string) => {
    const project = await db.orm.public.Project.create({
      name,
      description: "Deleted items test fixture",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId,
    });
    projectIds.push(project.id);
    return project;
  };

  const makeTask = async (projectId: number, creatorId: number, title: string) => {
    const task = await db.orm.public.Task.create({
      title,
      description: null,
      status: 1,
      priority: 2,
      projectId,
      creatorId,
    });
    taskIds.push(task.id);
    return task;
  };

  beforeAll(async () => {
    owner = await makeUser("Trash Owner");
    outsider = await makeUser("Trash Outsider");
    const activeProject = await makeProject(owner.id, "Active fixture project");
    const deletedProject = await makeProject(owner.id, "Deleted fixture project");
    activeProjectId = activeProject.id;
    deletedProjectId = deletedProject.id;
    const deletedTask = await makeTask(activeProjectId, owner.id, "Deleted task");
    const childDeletedTask = await makeTask(
      deletedProjectId,
      owner.id,
      "Task under deleted project",
    );
    const activeTask = await makeTask(activeProjectId, owner.id, "Active task");
    deletedTaskId = deletedTask.id;
    taskUnderDeletedProjectId = childDeletedTask.id;
    activeTaskId = activeTask.id;
    const deletedAt = Temporal.Now.instant().toString();
    await db.orm.public.Task.where({ id: deletedTaskId }).update({
      deletedAt,
      deletedById: owner.id,
    });
    await db.orm.public.Task.where({ id: taskUnderDeletedProjectId }).update({
      deletedAt,
      deletedById: owner.id,
    });
    const deletion = await owner.api.delete(`/api/projects/${deletedProjectId}`);
    expect(deletion.status).toBe(204);
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
      await db.orm.public.ProjectMember.where({ projectId }).deleteAll();
      await db.orm.public.Project.where({ id: projectId }).deleteAll();
    }
    for (const sessionId of sessionIds) {
      await db.orm.public.Session.where({ id: sessionId }).deleteAll();
    }
    for (const userId of userIds) {
      await db.orm.public.User.where({ id: userId }).deleteAll();
    }
  });

  it("lists only the owner's deleted projects and tasks, excluding active records", async () => {
    const projects = await owner.api.get("/api/projects/deleted");
    const tasks = await owner.api.get("/api/tasks/deleted");

    expect(projects.status).toBe(200);
    expect(projects.body.projects.map((project: { id: number }) => project.id)).toContain(deletedProjectId);
    expect(projects.body.projects.map((project: { id: number }) => project.id)).not.toContain(activeProjectId);
    expect(projects.body.projects[0]).toHaveProperty("deletedAt");

    expect(tasks.status).toBe(200);
    const listedIds = tasks.body.tasks.map((task: { id: number }) => task.id);
    expect(listedIds).toContain(deletedTaskId);
    expect(listedIds).toContain(taskUnderDeletedProjectId);
    expect(listedIds).not.toContain(activeTaskId);
    const child = tasks.body.tasks.find((task: { id: number }) => task.id === taskUnderDeletedProjectId);
    expect(child.project.deletedAt).not.toBeNull();
    expect(child).not.toHaveProperty("deletedById");
  });

  it("does not expose or restore another owner's deleted items", async () => {
    const projects = await outsider.api.get("/api/projects/deleted");
    const tasks = await outsider.api.get("/api/tasks/deleted");
    const restore = await outsider.api.post(`/api/projects/${deletedProjectId}/restore`);

    expect(projects.status).toBe(200);
    expect(projects.body.projects).toEqual([]);
    expect(tasks.status).toBe(200);
    expect(tasks.body.tasks).toEqual([]);
    expect(restore.status).toBe(404);
  });

  it("requires authentication to list deleted items", async () => {
    expect((await request(app).get("/api/projects/deleted")).status).toBe(401);
    expect((await request(app).get("/api/tasks/deleted")).status).toBe(401);
  });

  it("restores projects for their owner and blocks task restoration until the parent is active", async () => {
    const blocked = await owner.api.patch(`/api/tasks/${taskUnderDeletedProjectId}/restore`);
    expect(blocked.status).toBe(404);
    expect((await db.orm.public.Task.where({ id: taskUnderDeletedProjectId }).first())?.deletedAt).not.toBeNull();

    const restored = await owner.api.post(`/api/projects/${deletedProjectId}/restore`);
    expect(restored.status).toBe(200);
    expect(restored.body.project.deletedAt).toBeNull();

    const taskRestored = await owner.api.patch(`/api/tasks/${taskUnderDeletedProjectId}/restore`);
    expect(taskRestored.status).toBe(200);
    expect((await db.orm.public.Task.where({ id: taskUnderDeletedProjectId }).first())?.deletedAt).toBeNull();
  });
});
