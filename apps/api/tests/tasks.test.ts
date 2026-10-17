import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  authenticatedRequest,
  authenticatedRequestWithSession,
  createAuthenticatedAgent,
  setupTestAuth,
} from "./helpers/auth.helper";
import {
  createTestProject,
  deleteTestProject,
} from "./helpers/project.helpers";
import { db } from "../src/prisma/db";
import { assignTask } from "../src/service/task.service";
import { createUser } from "../src/service/auth.service";
import { Temporal } from "@js-temporal/polyfill";
import { createSession } from "../src/service/session.service";
import request from "supertest";
import app from "../src/app";
describe("Task API", () => {
  let createdTaskId: number | undefined;
  let testProjectId: number;
  let sessionA: string;
  let sessionB: string;
  const createTestUser = async (suffix: string) => {
    const user = await createUser(
      `Project Member Test ${suffix}`,
      `project-member-${suffix}-${Date.now()}@example.com`,
      "password123",
    );

    return user;
  };
  beforeAll(async () => {
    sessionA = await setupTestAuth();
    sessionB = await setupTestAuth();
  });
  beforeAll(async () => {
    await setupTestAuth();
    const project = await createTestProject();
    testProjectId = project.id;
  });

  afterEach(async () => {
    if (createdTaskId) {
      await authenticatedRequest().delete(`/api/tasks/${createdTaskId}`);
      createdTaskId = undefined;
    }
  });
  afterAll(async () => {
    if (testProjectId) {
      await deleteTestProject(testProjectId);
    }
  });
  it("should get tasks", async () => {
    const response = await authenticatedRequest().get("/api/tasks");

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("pagination");
  });

  it("should create a task", async () => {
    const response = await authenticatedRequest().post("/api/tasks").send({
      title: "[TEST] Automated test task",
      description: "[TEST] Created by Vitest",
      status: "TODO",
      priority: "HIGH",
      projectId: testProjectId,
    });

    expect(response.status).toBe(201);

    expect(response.body).toHaveProperty("id");
    expect(response.body.status).toBe("TODO");
    expect(response.body.priority).toBe("HIGH");

    createdTaskId = response.body.id;
  });
  it("should get a task by id", async () => {
    const createResponse = await authenticatedRequest()
      .post("/api/tasks")
      .send({
        title: "[TEST] Get task by id",
        description: "[TEST] Created by Vitest",
        status: "TODO",
        priority: "HIGH",
        projectId: testProjectId,
      });

    expect(createResponse.status).toBe(201);

    createdTaskId = createResponse.body.id;

    const response = await authenticatedRequest().get(
      `/api/tasks/${createdTaskId}`,
    );

    expect(response.status).toBe(200);

    expect(response.body.id).toBe(createdTaskId);
    expect(response.body.title).toBe("[TEST] Get task by id");
    expect(response.body.status).toBe("TODO");
    expect(response.body.priority).toBe("HIGH");
  });
  it("should return 404 for a non-existent task", async () => {
    const response = await authenticatedRequest().get("/api/tasks/999999999");

    expect(response.status).toBe(404);
  });
  it("should update a task", async () => {
    const createResponse = await authenticatedRequest()
      .post("/api/tasks")
      .send({
        title: "[TEST] Update task",
        description: "[TEST] Before update",
        status: "TODO",
        priority: "LOW",
        projectId: testProjectId,
      });

    expect(createResponse.status).toBe(201);

    createdTaskId = createResponse.body.id;

    const response = await authenticatedRequest()
      .patch(`/api/tasks/${createdTaskId}`)
      .send({
        title: "[TEST] Updated task",
        description: "[TEST] After update",
        status: "IN_PROGRESS",
        priority: "HIGH",
      });

    expect(response.status).toBe(200);

    expect(response.body.id).toBe(createdTaskId);
    expect(response.body.title).toBe("[TEST] Updated task");
    expect(response.body.description).toBe("[TEST] After update");
    expect(response.body.status).toBe("IN_PROGRESS");
    expect(response.body.priority).toBe("HIGH");
  });
  it("should delete a task", async () => {
    const createResponse = await authenticatedRequest()
      .post("/api/tasks")
      .send({
        title: "[TEST] Delete task",
        description: "[TEST] Will be deleted",
        status: "TODO",
        priority: "LOW",
        projectId: testProjectId,
      });

    expect(createResponse.status).toBe(201);

    createdTaskId = createResponse.body.id;

    const deleteResponse = await authenticatedRequest().delete(
      `/api/tasks/${createdTaskId}`,
    );

    expect(deleteResponse.status).toBe(204);

    // Prevent afterEach from trying to delete it again
    createdTaskId = undefined;

    const getResponse = await authenticatedRequest().get(
      `/api/tasks/${createResponse.body.id}`,
    );

    expect(getResponse.status).toBe(404);
  });
  it("should reject an invalid task status", async () => {
    const response = await authenticatedRequest().post("/api/tasks").send({
      title: "[TEST] Invalid status",
      description: "[TEST] Should fail",
      status: "INVALID_STATUS",
      priority: "HIGH",
      projectId: testProjectId,
    });

    expect(response.status).toBe(400);
  });

  it("should reject an invalid task priority", async () => {
    const response = await authenticatedRequest().post("/api/tasks").send({
      title: "[TEST] Invalid priority",
      description: "[TEST] Should fail",
      status: "TODO",
      priority: "INVALID_PRIORITY",
      projectId: testProjectId,
    });

    expect(response.status).toBe(400);
  });
  it("should reject a task with a non-existent project", async () => {
    const response = await authenticatedRequest().post("/api/tasks").send({
      title: "[TEST] Invalid project",
      description: "[TEST] Should fail",
      status: "TODO",
      priority: "HIGH",
      projectId: 999999999,
    });

    expect(response.status).toBe(404);
  });

  it("should partially update a task", async () => {
    const createResponse = await authenticatedRequest()
      .post("/api/tasks")
      .send({
        title: "[TEST] Partial update",
        description: "[TEST] Original description",
        status: "TODO",
        priority: "LOW",
        projectId: testProjectId,
      });

    expect(createResponse.status).toBe(201);

    createdTaskId = createResponse.body.id;

    const updateResponse = await authenticatedRequest()
      .patch(`/api/tasks/${createdTaskId}`)
      .send({
        status: "IN_PROGRESS",
      });

    expect(updateResponse.status).toBe(200);

    expect(updateResponse.body.id).toBe(createdTaskId);

    // Updated field
    expect(updateResponse.body.status).toBe("IN_PROGRESS");

    // Untouched fields should remain unchanged
    expect(updateResponse.body.title).toBe("[TEST] Partial update");
    expect(updateResponse.body.description).toBe("[TEST] Original description");
    expect(updateResponse.body.priority).toBe("LOW");
    expect(updateResponse.body.projectId).toBe(testProjectId);
  });
  it("should return 404 when updating a non-existent task", async () => {
    const response = await authenticatedRequest()
      .patch("/api/tasks/999999999")
      .send({
        status: "IN_PROGRESS",
      });

    expect(response.status).toBe(404);
  });
  it("should filter tasks by status", async () => {
    const todoResponse = await authenticatedRequest().post("/api/tasks").send({
      title: "[TEST] TODO filter task",
      description: "[TEST] Status filter",
      status: "TODO",
      priority: "LOW",
      projectId: testProjectId,
    });

    expect(todoResponse.status).toBe(201);

    const completedResponse = await authenticatedRequest()
      .post("/api/tasks")
      .send({
        title: "[TEST] COMPLETED filter task",
        description: "[TEST] Status filter",
        status: "COMPLETED",
        priority: "LOW",
        projectId: testProjectId,
      });

    expect(completedResponse.status).toBe(201);

    createdTaskId = completedResponse.body.id;

    const response = await authenticatedRequest().get("/api/tasks").query({
      status: "TODO",
    });

    expect(response.status).toBe(200);

    expect(response.body.data.length).toBeGreaterThan(0);

    expect(
      response.body.data.every(
        (task: { status: string }) => task.status === "TODO",
      ),
    ).toBe(true);

    // TODO task also needs cleanup
    await authenticatedRequest().delete(`/api/tasks/${todoResponse.body.id}`);
  });
  it("should filter tasks by priority", async () => {
    const lowResponse = await authenticatedRequest().post("/api/tasks").send({
      title: "[TEST] LOW priority filter task",
      description: "[TEST] Priority filter",
      status: "TODO",
      priority: "LOW",
      projectId: testProjectId,
    });

    expect(lowResponse.status).toBe(201);

    const highResponse = await authenticatedRequest().post("/api/tasks").send({
      title: "[TEST] HIGH priority filter task",
      description: "[TEST] Priority filter",
      status: "TODO",
      priority: "HIGH",
      projectId: testProjectId,
    });

    expect(highResponse.status).toBe(201);

    createdTaskId = highResponse.body.id;

    const response = await authenticatedRequest().get("/api/tasks").query({
      priority: "LOW",
    });

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);

    expect(
      response.body.data.every(
        (task: { priority: string }) => task.priority === "LOW",
      ),
    ).toBe(true);

    await authenticatedRequest().delete(`/api/tasks/${lowResponse.body.id}`);
  });
  it("should filter tasks by project", async () => {
    const taskResponse = await authenticatedRequest().post("/api/tasks").send({
      title: "[TEST] Project filter task",
      description: "Task for project filtering",
      status: "TODO",
      priority: "HIGH",
      projectId: testProjectId,
    });

    expect(taskResponse.status).toBe(201);

    const response = await authenticatedRequest().get("/api/tasks").query({
      projectId: testProjectId,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);

    expect(
      response.body.data.every(
        (task: { projectId: number }) => task.projectId === testProjectId,
      ),
    ).toBe(true);

    await authenticatedRequest().delete(`/api/tasks/${taskResponse.body.id}`);
  });
  it("should search tasks by title or description", async () => {
    const titleResponse = await authenticatedRequest().post("/api/tasks").send({
      title: "[TEST] Unique Search Title",
      description: "[TEST] Normal description",
      status: "TODO",
      priority: "LOW",
      projectId: testProjectId,
    });

    expect(titleResponse.status).toBe(201);

    const descriptionResponse = await authenticatedRequest()
      .post("/api/tasks")
      .send({
        title: "[TEST] Normal title",
        description: "[TEST] Unique Search Description",
        status: "TODO",
        priority: "LOW",
        projectId: testProjectId,
      });

    expect(descriptionResponse.status).toBe(201);

    createdTaskId = descriptionResponse.body.id;

    const titleSearchResponse = await authenticatedRequest()
      .get("/api/tasks")
      .query({
        search: "Unique Search Title",
      });

    expect(titleSearchResponse.status).toBe(200);

    expect(
      titleSearchResponse.body.data.some(
        (task: { id: number }) => task.id === titleResponse.body.id,
      ),
    ).toBe(true);

    const descriptionSearchResponse = await authenticatedRequest()
      .get("/api/tasks")
      .query({
        search: "Unique Search Description",
      });

    expect(descriptionSearchResponse.status).toBe(200);

    expect(
      descriptionSearchResponse.body.data.some(
        (task: { id: number }) => task.id === descriptionResponse.body.id,
      ),
    ).toBe(true);

    await authenticatedRequest().delete(`/api/tasks/${titleResponse.body.id}`);
  });
  it("should filter tasks using multiple filters", async () => {
    const matchingTask = await authenticatedRequest().post("/api/tasks").send({
      title: "[TEST] Combined filter matching task",
      description: "[TEST] Combined filters",
      status: "TODO",
      priority: "HIGH",
      projectId: testProjectId,
    });

    expect(matchingTask.status).toBe(201);

    const statusMismatch = await authenticatedRequest()
      .post("/api/tasks")
      .send({
        title: "[TEST] Combined filter status mismatch",
        description: "[TEST] Combined filters",
        status: "COMPLETED",
        priority: "HIGH",
        projectId: testProjectId,
      });

    expect(statusMismatch.status).toBe(201);

    const priorityMismatch = await authenticatedRequest()
      .post("/api/tasks")
      .send({
        title: "[TEST] Combined filter priority mismatch",
        description: "[TEST] Combined filters",
        status: "TODO",
        priority: "LOW",
        projectId: testProjectId,
      });

    expect(priorityMismatch.status).toBe(201);

    createdTaskId = priorityMismatch.body.id;

    const response = await authenticatedRequest().get("/api/tasks").query({
      status: "TODO",
      priority: "HIGH",
      projectId: testProjectId,
    });

    expect(response.status).toBe(200);

    expect(
      response.body.data.some(
        (task: { id: number }) => task.id === matchingTask.body.id,
      ),
    ).toBe(true);

    expect(
      response.body.data.every(
        (task: { status: string; priority: string; projectId: number }) =>
          task.status === "TODO" &&
          task.priority === "HIGH" &&
          task.projectId === testProjectId,
      ),
    ).toBe(true);

    await authenticatedRequest().delete(`/api/tasks/${matchingTask.body.id}`);
    await authenticatedRequest().delete(`/api/tasks/${statusMismatch.body.id}`);
  });
  it("should paginate tasks", async () => {
    const response = await authenticatedRequest().get("/api/tasks").query({
      page: 1,
      limit: 2,
    });

    expect(response.status).toBe(200);

    expect(response.body.data.length).toBeLessThanOrEqual(2);

    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(2);

    expect(response.body.pagination.total).toEqual(expect.any(Number));

    expect(response.body.pagination.totalPages).toEqual(expect.any(Number));
  });
  it("should return the correct data on the last pagination page", async () => {
    const taskIds: number[] = [];

    for (let i = 1; i <= 5; i++) {
      const response = await authenticatedRequest()
        .post("/api/tasks")
        .send({
          title: `[TEST] Pagination last page ${i}`,
          description: "[TEST] Pagination",
          status: "TODO",
          priority: "LOW",
          projectId: testProjectId,
        });

      expect(response.status).toBe(201);

      taskIds.push(response.body.id);
    }

    const firstPageResponse = await authenticatedRequest()
      .get("/api/tasks")
      .query({
        page: 1,
        limit: 2,
      });

    expect(firstPageResponse.status).toBe(200);

    const total = firstPageResponse.body.pagination.total;
    const totalPages = firstPageResponse.body.pagination.totalPages;

    expect(total).toBeGreaterThanOrEqual(5);
    expect(totalPages).toBe(Math.ceil(total / 2));

    const lastPageResponse = await authenticatedRequest()
      .get("/api/tasks")
      .query({
        page: totalPages,
        limit: 2,
      });

    expect(lastPageResponse.status).toBe(200);

    expect(lastPageResponse.body.pagination.page).toBe(totalPages);
    expect(lastPageResponse.body.pagination.limit).toBe(2);
    expect(lastPageResponse.body.pagination.total).toBe(total);
    expect(lastPageResponse.body.pagination.totalPages).toBe(totalPages);

    expect(lastPageResponse.body.data.length).toBeGreaterThan(0);
    expect(lastPageResponse.body.data.length).toBeLessThanOrEqual(2);

    for (const id of taskIds) {
      await authenticatedRequest().delete(`/api/tasks/${id}`);
    }
  });
  it("should return empty data for a page beyond the last page", async () => {
    const response = await authenticatedRequest().get("/api/tasks").query({
      page: 1,
      limit: 2,
    });

    expect(response.status).toBe(200);

    const total = response.body.pagination.total;
    const totalPages = response.body.pagination.totalPages;

    expect(totalPages).toBe(Math.ceil(total / 2));

    const beyondLastPageResponse = await authenticatedRequest()
      .get("/api/tasks")
      .query({
        page: totalPages + 1,
        limit: 2,
      });

    expect(beyondLastPageResponse.status).toBe(200);

    expect(beyondLastPageResponse.body.data).toEqual([]);

    expect(beyondLastPageResponse.body.pagination.page).toBe(totalPages + 1);

    expect(beyondLastPageResponse.body.pagination.limit).toBe(2);

    expect(beyondLastPageResponse.body.pagination.total).toBe(total);

    expect(beyondLastPageResponse.body.pagination.totalPages).toBe(totalPages);
  });
  it("should return different records on different pagination pages", async () => {
    const taskIds: number[] = [];

    for (let i = 1; i <= 4; i++) {
      const response = await authenticatedRequest()
        .post("/api/tasks")
        .send({
          title: `[TEST] Offset pagination ${i}`,
          description: "[TEST] Offset pagination",
          status: "TODO",
          priority: "LOW",
          projectId: testProjectId,
        });

      expect(response.status).toBe(201);

      taskIds.push(response.body.id);
    }

    const page1Response = await authenticatedRequest().get("/api/tasks").query({
      page: 1,
      limit: 2,
    });

    expect(page1Response.status).toBe(200);

    const page2Response = await authenticatedRequest().get("/api/tasks").query({
      page: 2,
      limit: 2,
    });

    expect(page2Response.status).toBe(200);

    const page1Ids = page1Response.body.data.map(
      (task: { id: number }) => task.id,
    );

    const page2Ids = page2Response.body.data.map(
      (task: { id: number }) => task.id,
    );

    const page1TestTaskIds = page1Ids.filter((id: number) =>
      taskIds.includes(id),
    );

    const page2TestTaskIds = page2Ids.filter((id: number) =>
      taskIds.includes(id),
    );

    expect(page1TestTaskIds.length).toBeGreaterThan(0);
    expect(page2TestTaskIds.length).toBeGreaterThan(0);

    expect(
      page1TestTaskIds.some((id: number) => page2TestTaskIds.includes(id)),
    ).toBe(false);

    for (const id of taskIds) {
      await authenticatedRequest().delete(`/api/tasks/${id}`);
    }
  });
  it("should paginate filtered tasks", async () => {
    const taskIds: number[] = [];

    for (let i = 1; i <= 5; i++) {
      const response = await authenticatedRequest()
        .post("/api/tasks")
        .send({
          title: `[TEST] Filter pagination ${i}`,
          description: "[TEST] Filter pagination",
          status: "TODO",
          priority: "LOW",
          projectId: testProjectId,
        });

      expect(response.status).toBe(201);

      taskIds.push(response.body.id);
    }

    const response = await authenticatedRequest().get("/api/tasks").query({
      status: "TODO",
      page: 1,
      limit: 2,
    });

    expect(response.status).toBe(200);

    expect(response.body.data.length).toBeLessThanOrEqual(2);

    expect(
      response.body.data.every(
        (task: { status: string }) => task.status === "TODO",
      ),
    ).toBe(true);

    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(2);
    expect(response.body.pagination.total).toEqual(expect.any(Number));
    expect(response.body.pagination.totalPages).toEqual(expect.any(Number));

    for (const id of taskIds) {
      await authenticatedRequest().delete(`/api/tasks/${id}`);
    }
  });
  it("should reject page 0", async () => {
    const response = await authenticatedRequest().get("/api/tasks").query({
      page: 0,
      limit: 2,
    });

    expect(response.status).toBe(400);
  });
  it("should reject limit 0", async () => {
    const response = await authenticatedRequest().get("/api/tasks").query({
      page: 1,
      limit: 0,
    });

    expect(response.status).toBe(400);
  });
  it("should reject a negative page", async () => {
    const response = await authenticatedRequest().get("/api/tasks").query({
      page: -1,
      limit: 2,
    });

    expect(response.status).toBe(400);
  });
  it("should reject a negative limit", async () => {
    const response = await authenticatedRequest().get("/api/tasks").query({
      page: 1,
      limit: -5,
    });

    expect(response.status).toBe(400);
  });
  it("should sort tasks by title in ascending order", async () => {
    const taskIds: number[] = [];

    const titles = ["[TEST] Charlie", "[TEST] Alpha", "[TEST] Bravo"];

    for (const title of titles) {
      const response = await authenticatedRequest().post("/api/tasks").send({
        title,
        description: "[TEST] Sorting",
        status: "TODO",
        priority: "LOW",
        projectId: testProjectId,
      });

      expect(response.status).toBe(201);

      taskIds.push(response.body.id);
    }

    const response = await authenticatedRequest().get("/api/tasks").query({
      sortBy: "title",
      sortOrder: "asc",
    });

    expect(response.status).toBe(200);

    const testTasks = response.body.data.filter((task: { id: number }) =>
      taskIds.includes(task.id),
    );

    expect(testTasks).toHaveLength(3);

    expect(testTasks.map((task: { title: string }) => task.title)).toEqual([
      "[TEST] Alpha",
      "[TEST] Bravo",
      "[TEST] Charlie",
    ]);

    for (const id of taskIds) {
      await authenticatedRequest().delete(`/api/tasks/${id}`);
    }
  });
  it("should sort tasks by title in descending order", async () => {
    const taskIds: number[] = [];

    const titles = ["[TEST] Charlie", "[TEST] Alpha", "[TEST] Bravo"];

    for (const title of titles) {
      const response = await authenticatedRequest().post("/api/tasks").send({
        title,
        description: "[TEST] Sorting",
        status: "TODO",
        priority: "LOW",
        projectId: testProjectId,
      });

      expect(response.status).toBe(201);

      taskIds.push(response.body.id);
    }

    const response = await authenticatedRequest().get("/api/tasks").query({
      sortBy: "title",
      sortOrder: "desc",
      limit: 100,
    });

    expect(response.status).toBe(200);

    const testTasks = response.body.data.filter((task: { id: number }) =>
      taskIds.includes(task.id),
    );

    expect(testTasks).toHaveLength(3);

    expect(testTasks.map((task: { title: string }) => task.title)).toEqual([
      "[TEST] Charlie",
      "[TEST] Bravo",
      "[TEST] Alpha",
    ]);

    for (const id of taskIds) {
      await authenticatedRequest().delete(`/api/tasks/${id}`);
    }
  });
  it("should sort tasks by priority in ascending order", async () => {
    const taskIds: number[] = [];

    const priorities = ["HIGH", "LOW", "URGENT", "MEDIUM"];

    for (let i = 0; i < priorities.length; i++) {
      const response = await authenticatedRequest()
        .post("/api/tasks")
        .send({
          title: `[TEST] Priority sorting ${i + 1}`,
          description: "[TEST] Priority sorting",
          status: "TODO",
          priority: priorities[i],
          projectId: testProjectId,
        });

      expect(response.status).toBe(201);

      taskIds.push(response.body.id);
    }

    const response = await authenticatedRequest().get("/api/tasks").query({
      sortBy: "priority",
      sortOrder: "asc",
      limit: 100,
    });

    expect(response.status).toBe(200);

    const testTasks = response.body.data.filter((task: { id: number }) =>
      taskIds.includes(task.id),
    );

    expect(testTasks).toHaveLength(4);

    expect(
      testTasks.map((task: { priority: string }) => task.priority),
    ).toEqual(["LOW", "MEDIUM", "HIGH", "URGENT"]);

    for (const id of taskIds) {
      await authenticatedRequest().delete(`/api/tasks/${id}`);
    }
  });
  it("should sort tasks by priority in descending order", async () => {
    const taskIds: number[] = [];

    const priorities = ["HIGH", "LOW", "URGENT", "MEDIUM"];

    for (let i = 0; i < priorities.length; i++) {
      const response = await authenticatedRequest()
        .post("/api/tasks")
        .send({
          title: `[TEST] Priority descending ${i + 1}`,
          description: "[TEST] Priority sorting",
          status: "TODO",
          priority: priorities[i],
          projectId: testProjectId,
        });

      expect(response.status).toBe(201);

      taskIds.push(response.body.id);
    }

    const response = await authenticatedRequest().get("/api/tasks").query({
      sortBy: "priority",
      sortOrder: "desc",
      limit: 100,
    });

    expect(response.status).toBe(200);

    const testTasks = response.body.data.filter((task: { id: number }) =>
      taskIds.includes(task.id),
    );

    expect(testTasks).toHaveLength(4);

    expect(
      testTasks.map((task: { priority: string }) => task.priority),
    ).toEqual(["URGENT", "HIGH", "MEDIUM", "LOW"]);

    for (const id of taskIds) {
      await authenticatedRequest().delete(`/api/tasks/${id}`);
    }
  });
  it("should reject a task without a title", async () => {
    const response = await authenticatedRequest().post("/api/tasks").send({
      description: "[TEST] Missing title",
      status: "TODO",
      priority: "LOW",
      projectId: testProjectId,
    });

    expect(response.status).toBe(400);
  });
  it("should reject a task with an empty title", async () => {
    const response = await authenticatedRequest().post("/api/tasks").send({
      title: "",
      description: "[TEST] Empty title",
      status: "TODO",
      priority: "LOW",
      projectId: testProjectId,
    });

    expect(response.status).toBe(400);
  });
  it("should reject a task with a whitespace-only title", async () => {
    const response = await authenticatedRequest().post("/api/tasks").send({
      title: "   ",
      description: "[TEST] Whitespace title",
      status: "TODO",
      priority: "LOW",
      projectId: testProjectId,
    });

    expect(response.status).toBe(400);
  });
  it("should reject an invalid projectId", async () => {
    const response = await authenticatedRequest().post("/api/tasks").send({
      title: "[TEST] Invalid project id",
      description: "[TEST] Invalid project id",
      status: "TODO",
      priority: "LOW",
      projectId: "invalid",
    });

    expect(response.status).toBe(400);
  });
  it("should reject updating a task with a non-existent project", async () => {
    const createResponse = await authenticatedRequest()
      .post("/api/tasks")
      .send({
        title: "[TEST] Invalid update project",
        description: "[TEST] Update project",
        status: "TODO",
        priority: "LOW",
        projectId: testProjectId,
      });

    expect(createResponse.status).toBe(201);

    const taskId = createResponse.body.id;

    const updateResponse = await authenticatedRequest()
      .patch(`/api/tasks/${taskId}`)
      .send({
        projectId: 999999999,
      });

    expect(updateResponse.status).toBe(404);

    await authenticatedRequest().delete(`/api/tasks/${taskId}`);
  });
  it("should create a task with a due date", async () => {
    const response = await authenticatedRequest().post("/api/tasks").send({
      title: "[TEST] Due date task",
      description: "[TEST] Due date",
      status: "TODO",
      priority: "LOW",
      dueDate: "2026-12-31",
      projectId: testProjectId,
    });

    expect(response.status).toBe(201);
    expect(response.body.dueDate).toBeDefined();

    const taskId = response.body.id;

    await authenticatedRequest().delete(`/api/tasks/${taskId}`);
  });
  it("should reject an invalid due date", async () => {
    const response = await authenticatedRequest().post("/api/tasks").send({
      title: "[TEST] Invalid due date",
      description: "[TEST] Invalid due date",
      status: "TODO",
      priority: "LOW",
      dueDate: "not-a-date",
      projectId: testProjectId,
    });

    expect(response.status).toBe(400);
  });
  it("should reject an invalid sort field", async () => {
    const response = await authenticatedRequest().get("/api/tasks").query({
      sortBy: "invalidField",
      sortOrder: "asc",
    });

    expect(response.status).toBe(400);
  });
  it("should reject an invalid sort order", async () => {
    const response = await authenticatedRequest().get("/api/tasks").query({
      sortBy: "title",
      sortOrder: "invalid",
    });

    expect(response.status).toBe(400);
  });
  it("should prevent a user from reading another user's task", async () => {
    const userA = authenticatedRequestWithSession(sessionA);
    const userB = authenticatedRequestWithSession(sessionB);

    const projectResponse = await userB.post("/api/projects").send({
      name: "[TEST] User B project",
      description: "[TEST] User B project",
      status: "Active",
      startDate: "2026-01-01",
      dueDate: "2026-12-31",
    });

    expect(projectResponse.status).toBe(201);

    const projectId = projectResponse.body.id;

    const taskResponse = await userB.post("/api/tasks").send({
      title: "[TEST] User B task",
      description: "[TEST] User B task",
      status: "TODO",
      priority: "LOW",
      projectId,
    });

    expect(taskResponse.status).toBe(201);

    const taskId = taskResponse.body.id;

    const response = await userA.get(`/api/tasks/${taskId}`);

    expect(response.status).toBe(404);
  });
  it("should prevent a user from updating another user's task", async () => {
    const userA = authenticatedRequestWithSession(sessionA);
    const userB = authenticatedRequestWithSession(sessionB);

    const projectResponse = await userB.post("/api/projects").send({
      name: "[TEST] User B project",
      description: "[TEST] User B project",
      status: "Active",
      startDate: "2026-01-01",
      dueDate: "2026-12-31",
    });

    expect(projectResponse.status).toBe(201);

    const taskResponse = await userB.post("/api/tasks").send({
      title: "[TEST] Original title",
      description: "[TEST] Original description",
      status: "TODO",
      priority: "LOW",
      projectId: projectResponse.body.id,
    });

    expect(taskResponse.status).toBe(201);

    const taskId = taskResponse.body.id;

    const updateResponse = await userA.patch(`/api/tasks/${taskId}`).send({
      title: "[TEST] Unauthorized update",
    });

    expect(updateResponse.status).toBe(404);

    const ownerResponse = await userB.get(`/api/tasks/${taskId}`);

    expect(ownerResponse.status).toBe(200);
    expect(ownerResponse.body.title).toBe("[TEST] Original title");
  });
  it("should prevent a user from deleting another user's task", async () => {
    const userA = authenticatedRequestWithSession(sessionA);
    const userB = authenticatedRequestWithSession(sessionB);

    const projectResponse = await userB.post("/api/projects").send({
      name: "[TEST] User B project",
      description: "[TEST] User B project",
      status: "Active",
      startDate: "2026-01-01",
      dueDate: "2026-12-31",
    });

    expect(projectResponse.status).toBe(201);

    const taskResponse = await userB.post("/api/tasks").send({
      title: "[TEST] User B task",
      description: "[TEST] User B task",
      status: "TODO",
      priority: "LOW",
      projectId: projectResponse.body.id,
    });

    expect(taskResponse.status).toBe(201);

    const taskId = taskResponse.body.id;

    const deleteResponse = await userA.delete(`/api/tasks/${taskId}`);

    expect(deleteResponse.status).toBe(404);

    const ownerResponse = await userB.get(`/api/tasks/${taskId}`);

    expect(ownerResponse.status).toBe(200);
    expect(ownerResponse.body.id).toBe(taskId);
  });
  it("should prevent a user from moving a task into another user's project", async () => {
    const userA = authenticatedRequestWithSession(sessionA);
    const userB = authenticatedRequestWithSession(sessionB);

    const projectAResponse = await userA.post("/api/projects").send({
      name: "[TEST] User B project",
      description: "[TEST] User B project",
      status: "Active",
      startDate: "2026-01-01",
      dueDate: "2026-12-31",
    });

    expect(projectAResponse.status).toBe(201);

    const projectBResponse = await userB.post("/api/projects").send({
      name: "[TEST] User B project",
      description: "[TEST] User B project",
      status: "Active",
      startDate: "2026-01-01",
      dueDate: "2026-12-31",
    });

    expect(projectBResponse.status).toBe(201);

    const taskResponse = await userA.post("/api/tasks").send({
      title: "[TEST] User A task",
      description: "[TEST] User A task",
      status: "TODO",
      priority: "LOW",
      projectId: projectAResponse.body.id,
    });

    expect(taskResponse.status).toBe(201);

    const taskId = taskResponse.body.id;

    const updateResponse = await userA.patch(`/api/tasks/${taskId}`).send({
      projectId: projectBResponse.body.id,
    });

    expect(updateResponse.status).toBe(404);

    const ownerResponse = await userA.get(`/api/tasks/${taskId}`);

    expect(ownerResponse.status).toBe(200);
    expect(ownerResponse.body.projectId).toBe(projectAResponse.body.id);
  });
  it("should prevent a user from reading another user's project", async () => {
    const userA = authenticatedRequestWithSession(sessionA);
    const userB = authenticatedRequestWithSession(sessionB);

    const projectResponse = await userB.post("/api/projects").send({
      name: "[TEST] User B project",
      description: "[TEST] User B project",
      status: "Active",
      startDate: "2026-01-01",
      dueDate: "2026-12-31",
    });

    expect(projectResponse.status).toBe(201);

    const projectId = projectResponse.body.id;

    const response = await userA.get(`/api/projects/${projectId}`);

    expect(response.status).toBe(404);
  });
  it("should prevent a user from updating another user's project", async () => {
    const userA = authenticatedRequestWithSession(sessionA);
    const userB = authenticatedRequestWithSession(sessionB);

    const projectResponse = await userB.post("/api/projects").send({
      name: "[TEST] User B project",
      description: "[TEST] User B project",
      status: "Active",
      startDate: "2026-01-01",
      dueDate: "2026-12-31",
    });

    expect(projectResponse.status).toBe(201);

    const projectId = projectResponse.body.id;

    const updateResponse = await userA
      .patch(`/api/projects/${projectId}`)
      .send({
        name: "[TEST] Unauthorized update",
      });

    expect(updateResponse.status).toBe(404);

    const ownerResponse = await userB.get(`/api/projects/${projectId}`);

    expect(ownerResponse.status).toBe(200);
    expect(ownerResponse.body.name).toBe("[TEST] User B project");
  });
  it("should prevent a user from deleting another user's project", async () => {
    const userA = authenticatedRequestWithSession(sessionA);
    const userB = authenticatedRequestWithSession(sessionB);

    const projectResponse = await userB.post("/api/projects").send({
      name: "[TEST] User B project",
      description: "[TEST] User B project",
      status: "Active",
      startDate: "2026-01-01",
      dueDate: "2026-12-31",
    });

    expect(projectResponse.status).toBe(201);

    const projectId = projectResponse.body.id;

    const deleteResponse = await userA.delete(`/api/projects/${projectId}`);

    expect(deleteResponse.status).toBe(404);

    const ownerResponse = await userB.get(`/api/projects/${projectId}`);

    expect(ownerResponse.status).toBe(200);
    expect(ownerResponse.body.id).toBe(projectId);
  });
  it("should return tasks for a project owned by the user", async () => {
    const project = await createTestProject();

    const response = await authenticatedRequest().get(
      `/api/projects/${project.id}/tasks`,
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
  it("should return 404 when the project does not exist", async () => {
    const response = await authenticatedRequest().get(
      "/api/projects/999999/tasks",
    );

    expect(response.status).toBe(404);
  });
  it("should return 404 when accessing another user's project tasks", async () => {
    const anotherUser = await createAuthenticatedAgent();

    try {
      const anotherUserRequest = authenticatedRequestWithSession(
        anotherUser.session.id,
      );

      const projectResponse = await anotherUserRequest
        .post("/api/projects")
        .send({
          name: "Another User's Project",
          description: "Test project",
          status: "Active",
          startDate: "2026-01-01",
          dueDate: "2026-12-31",
        });

      expect(projectResponse.status).toBe(201);

      const projectId = projectResponse.body.id;

      const response = await authenticatedRequest().get(
        `/api/projects/${projectId}/tasks`,
      );

      expect(response.status).toBe(404);
    } finally {
      await anotherUser.cleanup();
    }
  });
  it("should allow the project owner to assign a task to an active member", async () => {
    const owner = await createTestUser("api-assignment-owner");
    const member = await createTestUser("api-assignment-member");

    const ownerSession = await createSession(owner.id);

    const project = await db.orm.public.Project.create({
      name: `[TEST] API Assignment Project ${Date.now()}`,
      description: "API assignment test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: member.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] API Assignment task",
      description: "API assignment test",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
    });

    const response = await authenticatedRequestWithSession(ownerSession.id)
      .patch(`/api/tasks/${task.id}/assignment`)
      .send({
        assigneeId: member.id,
      });

    expect(response.status).toBe(200);
    expect(response.body.task.assigneeId).toBe(member.id);
  });
  it("should prevent a non-member from assigning a task", async () => {
    const owner = await createTestUser("assignment-owner");
    const nonMember = await createTestUser("assignment-non-member");
    const assignee = await createTestUser("assignment-assignee");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Assignment Project ${Date.now()}`,
      description: "Assignment test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: assignee.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] Assignment task",
      description: "Assignment test",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
    });

    await expect(
      assignTask(task.id, { assigneeId: assignee.id }, nonMember.id),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("should allow a project member to assign a task to the project owner", async () => {
    const owner = await createTestUser("api-assignment-owner-2");
    const member = await createTestUser("api-assignment-member-2");

    const memberSession = await createSession(member.id);

    const project = await db.orm.public.Project.create({
      name: `[TEST] API Member Assignment Project ${Date.now()}`,
      description: "API assignment test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: member.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] API Member Assignment task",
      description: "API assignment test",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
    });

    const response = await authenticatedRequestWithSession(memberSession.id)
      .patch(`/api/tasks/${task.id}/assignment`)
      .send({
        assigneeId: owner.id,
      });

    expect(response.status).toBe(200);
    expect(response.body.task.assigneeId).toBe(owner.id);
  });

  it("should reject assigning a task to a non-member", async () => {
    const owner = await createTestUser("api-assignment-owner-3");
    const nonMember = await createTestUser("api-assignment-non-member");

    const ownerSession = await createSession(owner.id);

    const project = await db.orm.public.Project.create({
      name: `[TEST] API Non Member Assignment Project ${Date.now()}`,
      description: "API assignment test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] API Non Member task",
      description: "API assignment test",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
    });

    const response = await authenticatedRequestWithSession(ownerSession.id)
      .patch(`/api/tasks/${task.id}/assignment`)
      .send({
        assigneeId: nonMember.id,
      });

    expect(response.status).toBe(400);
  });

  it("should allow a member to assign a task to another active member", async () => {
    const owner = await createTestUser("assignment-owner-3");
    const member1 = await createTestUser("assignment-member-3a");
    const member2 = await createTestUser("assignment-member-3b");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Assignment Project ${Date.now()}`,
      description: "Assignment test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    for (const member of [member1, member2]) {
      await db.orm.public.ProjectMember.create({
        projectId: project.id,
        userId: member.id,
        addedById: owner.id,
        joinedAt: new Date().toISOString(),
        removedAt: null,
      });
    }

    const task = await db.orm.public.Task.create({
      title: "[TEST] Assignment task",
      description: "Assignment test",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
      assigneeId: member1.id,
    });

    const result = await assignTask(
      task.id,
      { assigneeId: member2.id, reason: "Reassign task" },
      member1.id,
    );

    expect(result?.assigneeId).toBe(member2.id);

    const history = await db.orm.public.TaskAssignmentHistory.where({
      taskId: task.id,
    }).all();

    expect(history).toHaveLength(1);
    expect(history[0].action).toBe("REASSIGNED");
    expect(history[0].previousAssigneeId).toBe(member1.id);
    expect(history[0].newAssigneeId).toBe(member2.id);
    expect(history[0].performedById).toBe(member1.id);
    expect(history[0].reason).toBe("Reassign task");
  });

  it("should prevent a non-member from assigning a task", async () => {
    const owner = await createTestUser("assignment-owner-4");
    const member = await createTestUser("assignment-member-4");
    const nonMember = await createTestUser("assignment-non-member-4");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Assignment Project ${Date.now()}`,
      description: "Assignment test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: member.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] Assignment task",
      description: "Assignment test",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
    });

    await expect(
      assignTask(task.id, { assigneeId: member.id }, nonMember.id),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("should prevent owner from assigning task to a non-member", async () => {
    const owner = await createTestUser("assignment-owner-5");
    const nonMember = await createTestUser("assignment-non-member-5");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Assignment Project ${Date.now()}`,
      description: "Assignment test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] Assignment task",
      description: "Assignment test",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
    });

    await expect(
      assignTask(task.id, { assigneeId: nonMember.id }, owner.id),
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("should prevent member from assigning task to a non-member", async () => {
    const owner = await createTestUser("assignment-owner-6");
    const member = await createTestUser("assignment-member-6");
    const nonMember = await createTestUser("assignment-non-member-6");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Assignment Project ${Date.now()}`,
      description: "Assignment test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: member.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] Assignment task",
      description: "Assignment test",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
    });

    await expect(
      assignTask(task.id, { assigneeId: nonMember.id }, member.id),
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("should prevent assigning task to a removed member", async () => {
    const owner = await createTestUser("assignment-owner-7");
    const removedMember = await createTestUser("assignment-removed-member-7");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Assignment Project ${Date.now()}`,
      description: "Assignment test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: removedMember.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: new Date().toISOString(),
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] Assignment task",
      description: "Assignment test",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
    });

    await expect(
      assignTask(task.id, { assigneeId: removedMember.id }, owner.id),
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("should prevent assigning task to a nonexistent user", async () => {
    const owner = await createTestUser("assignment-owner-8");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Assignment Project ${Date.now()}`,
      description: "Assignment test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] Assignment task",
      description: "Assignment test",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
    });

    await expect(
      assignTask(task.id, { assigneeId: 999999999 }, owner.id),
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("should unassign an assigned task", async () => {
    const owner = await createTestUser("assignment-owner-9");
    const member = await createTestUser("assignment-member-9");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Assignment Project ${Date.now()}`,
      description: "Assignment test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: member.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] Assignment task",
      description: "Assignment test",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
      assigneeId: member.id,
    });

    const result = await assignTask(
      task.id,
      { assigneeId: null, reason: "No longer assigned" },
      owner.id,
    );

    expect(result?.assigneeId).toBeNull();

    const history = await db.orm.public.TaskAssignmentHistory.where({
      taskId: task.id,
    }).all();

    expect(history).toHaveLength(1);
    expect(history[0].action).toBe("UNASSIGNED");
    expect(history[0].previousAssigneeId).toBe(member.id);
    expect(history[0].newAssigneeId).toBeNull();
    expect(history[0].performedById).toBe(owner.id);
    expect(history[0].reason).toBe("No longer assigned");
  });

  it("should reject assignment when the requester is not a project member", async () => {
    const owner = await createTestUser("api-assignment-owner-4");
    const member = await createTestUser("api-assignment-member-4");
    const nonMember = await createTestUser("api-assignment-requester");

    const nonMemberSession = await createSession(nonMember.id);

    const project = await db.orm.public.Project.create({
      name: `[TEST] API Unauthorized Assignment Project ${Date.now()}`,
      description: "API assignment test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: member.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] API Unauthorized Assignment task",
      description: "API assignment test",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
    });

    const response = await authenticatedRequestWithSession(nonMemberSession.id)
      .patch(`/api/tasks/${task.id}/assignment`)
      .send({
        assigneeId: member.id,
      });

    expect(response.status).toBe(404);
  });

  it("should allow unassigning a task", async () => {
    const owner = await createTestUser("api-assignment-owner-5");
    const member = await createTestUser("api-assignment-member-5");

    const ownerSession = await createSession(owner.id);

    const project = await db.orm.public.Project.create({
      name: `[TEST] API Unassignment Project ${Date.now()}`,
      description: "API assignment test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: member.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] API Unassignment task",
      description: "API assignment test",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
      assigneeId: member.id,
    });

    const response = await authenticatedRequestWithSession(ownerSession.id)
      .patch(`/api/tasks/${task.id}/assignment`)
      .send({
        assigneeId: null,
      });

    expect(response.status).toBe(200);
    expect(response.body.task.assigneeId).toBeNull();
  });

  it("should reject an invalid task ID", async () => {
    const sessionId = await setupTestAuth();

    const response = await authenticatedRequestWithSession(sessionId)
      .patch("/api/tasks/invalid/assignment")
      .send({
        assigneeId: 1,
      });

    expect(response.status).toBe(400);
  });

  it("should reject an invalid assignment body", async () => {
    const sessionId = await setupTestAuth();

    const response = await authenticatedRequestWithSession(sessionId)
      .patch("/api/tasks/1/assignment")
      .send({
        assigneeId: "invalid",
      });

    expect(response.status).toBe(400);
  });

  it("should reject unauthenticated assignment requests", async () => {
    const response = await request(app).patch("/api/tasks/1/assignment").send({
      assigneeId: 1,
    });

    expect(response.status).toBe(401);
  });
  it("should not create duplicate history or notifications when assigning to the same user", async () => {
    const owner = await createTestUser("same-assignee-owner");
    const member = await createTestUser("same-assignee-member");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Same Assignee Project ${Date.now()}`,
      description: "Same assignee test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: member.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] Same Assignee Task",
      description: "Same assignee test",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
      assigneeId: member.id,
    });

    const result = await assignTask(
      task.id,
      { assigneeId: member.id },
      owner.id,
    );

    expect(result?.assigneeId).toBe(member.id);

    const history = await db.orm.public.TaskAssignmentHistory.where({
      taskId: task.id,
    }).all();

    const notifications = await db.orm.public.Notification.where({
      taskId: task.id,
      userId: member.id,
      type: "TASK_ASSIGNED",
    }).all();

    expect(history).toHaveLength(0);
    expect(notifications).toHaveLength(0);
  });

  it("should reject assignment to a soft-deleted task", async () => {
    const owner = await createTestUser("deleted-task-owner");
    const member = await createTestUser("deleted-task-member");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Deleted Task Project ${Date.now()}`,
      description: "Deleted task assignment test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: member.id,
      addedById: owner.id,
      joinedAt: new Date().toISOString(),
      removedAt: null,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] Deleted Task",
      description: "Deleted task assignment test",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
      deletedAt: new Date().toISOString(),
    });

    await expect(
      assignTask(task.id, { assigneeId: member.id }, owner.id),
    ).rejects.toMatchObject({
      statusCode: 404,
    });

    const history = await db.orm.public.TaskAssignmentHistory.where({
      taskId: task.id,
    }).all();

    expect(history).toHaveLength(0);
  });

  it("should reject deleting an already soft-deleted task without creating duplicate activity", async () => {
    const owner = await createTestUser("already-deleted-owner");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Already Deleted Project ${Date.now()}`,
      description: "Already deleted task test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] Already Deleted Task",
      description: "Testing repeated deletion",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
      deletedAt: Temporal.Now.instant().toString(),
      deletedById: owner.id,
    });

    const existingActivity = await db.orm.public.TaskActivity.create({
      taskId: task.id,
      actorId: owner.id,
      action: "DELETED",
      description: "Deleted task",
    });
    const ownerSession = await createSession(owner.id);
    const response = await authenticatedRequestWithSession(
      ownerSession.id,
    ).delete(`/api/tasks/${task.id}`);

    expect(response.status).toBe(404);

    const activities = await db.orm.public.TaskActivity.where({
      taskId: task.id,
      action: "DELETED",
    }).all();

    expect(activities).toHaveLength(1);
    expect(activities[0].id).toBe(existingActivity.id);
  });

  it("should restore a soft-deleted task and record activity", async () => {
    const owner = await createTestUser("restore-task-owner");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Restore Task Project ${Date.now()}`,
      description: "Task restoration test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    const deletedAt = Temporal.Now.instant().toString();

    const task = await db.orm.public.Task.create({
      title: "[TEST] Restore Task",
      description: "Testing task restoration",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
      deletedAt,
      deletedById: owner.id,
      scheduledDeletionAt: deletedAt,
    });

    const session = await createSession(owner.id);

    const response = await authenticatedRequestWithSession(session.id).patch(
      `/api/tasks/${task.id}/restore`,
    );

    expect(response.status).toBe(200);

    const restoredTask = await db.orm.public.Task.where({
      id: task.id,
    }).first();

    expect(restoredTask).not.toBeNull();
    expect(restoredTask!.deletedAt).toBeNull();
    expect(restoredTask!.deletedById).toBeNull();
    expect(restoredTask!.scheduledDeletionAt).toBeNull();

    const activities = await db.orm.public.TaskActivity.where({
      taskId: task.id,
      action: "RESTORED",
    }).all();

    expect(activities).toHaveLength(1);
  });
  it("should reject restoring an active task", async () => {
    const owner = await createTestUser("active-task-restore-owner");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Active Task Project ${Date.now()}`,
      description: "Active task restoration test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] Active Task",
      description: "Task is not deleted",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
      deletedAt: null,
    });

    const session = await createSession(owner.id);

    const response = await authenticatedRequestWithSession(session.id).patch(
      `/api/tasks/${task.id}/restore`,
    );

    expect(response.status).toBe(404);

    const activities = await db.orm.public.TaskActivity.where({
      taskId: task.id,
      action: "RESTORED",
    }).all();

    expect(activities).toHaveLength(0);
  });
  it("should reject restoring a deleted task when the requester is not the project owner", async () => {
    const owner = await createTestUser("restore-non-owner");
    const member = await createTestUser("restore-task-member");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Restore Permission Project ${Date.now()}`,
      description: "Restore permission test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    await db.orm.public.ProjectMember.create({
      projectId: project.id,
      userId: member.id,
      addedById: owner.id,
      joinedAt: Temporal.Now.instant().toString(),
      removedAt: null,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] Deleted Task",
      description: "Non-owner restoration test",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
      deletedAt: Temporal.Now.instant().toString(),
      deletedById: owner.id,
    });

    const session = await createSession(member.id);

    const response = await authenticatedRequestWithSession(session.id).patch(
      `/api/tasks/${task.id}/restore`,
    );

    expect(response.status).toBe(404);

    const unchangedTask = await db.orm.public.Task.where({
      id: task.id,
    }).first();

    expect(unchangedTask!.deletedAt).not.toBeNull();

    const activities = await db.orm.public.TaskActivity.where({
      taskId: task.id,
      action: "RESTORED",
    }).all();

    expect(activities).toHaveLength(0);
  });

  it("should not create due-date activity when the due date is unchanged", async () => {
    const owner = await createTestUser("same-due-date-owner");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Same Due Date Project ${Date.now()}`,
      description: "Same due date test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] Same Due Date Task",
      description: "Testing unchanged due date",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
      dueDate: Temporal.Instant.from("2026-11-15T00:00:00Z"),
    });

    const session = await createSession(owner.id);

    const response = await authenticatedRequestWithSession(session.id)
      .patch(`/api/tasks/${task.id}`)
      .send({ dueDate: "2026-11-15" });

    expect(response.status).toBe(200);

    const activities = await db.orm.public.TaskActivity.where({
      taskId: task.id,
      action: "DUE_DATE_CHANGED",
    }).all();

    expect(activities).toHaveLength(0);
  });

  it("should record the old and new due dates when the due date changes", async () => {
    const owner = await createTestUser("changed-due-date-owner");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Changed Due Date Project ${Date.now()}`,
      description: "Changed due date test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] Changed Due Date Task",
      description: "Testing due date change",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
      dueDate: Temporal.Instant.from("2026-11-15T00:00:00Z"),
    });

    const session = await createSession(owner.id);

    const response = await authenticatedRequestWithSession(session.id)
      .patch(`/api/tasks/${task.id}`)
      .send({ dueDate: "2026-11-20" });

    expect(response.status).toBe(200);

    const activities = await db.orm.public.TaskActivity.where({
      taskId: task.id,
      action: "DUE_DATE_CHANGED",
    }).all();

    expect(activities).toHaveLength(1);
    expect(activities[0].field).toBe("dueDate");
    expect(activities[0].oldValue).toBe("2026-11-15");
    expect(activities[0].newValue).toBe("2026-11-20");
  });

  it("should record activity when a task is moved to another accessible project", async () => {
    const owner = await createTestUser("move-task-owner");

    const firstProject = await db.orm.public.Project.create({
      name: `[TEST] Original Project ${Date.now()}`,
      description: "Original project",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    const secondProject = await db.orm.public.Project.create({
      name: `[TEST] Target Project ${Date.now()}`,
      description: "Target project",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] Move Task",
      description: "Testing project change",
      status: 1,
      priority: 2,
      projectId: firstProject.id,
      creatorId: owner.id,
    });

    const session = await createSession(owner.id);

    const response = await authenticatedRequestWithSession(session.id)
      .patch(`/api/tasks/${task.id}`)
      .send({ projectId: secondProject.id });

    expect(response.status).toBe(200);

    const updatedTask = await db.orm.public.Task.where({
      id: task.id,
    }).first();

    expect(updatedTask!.projectId).toBe(secondProject.id);

    const activities = await db.orm.public.TaskActivity.where({
      taskId: task.id,
      action: "UPDATED",
      field: "projectId",
    }).all();

    expect(activities).toHaveLength(1);
    expect(activities[0].oldValue).toBe(String(firstProject.id));
    expect(activities[0].newValue).toBe(String(secondProject.id));
  });

  it("should reject moving a task into a project the requester cannot access", async () => {
    const owner = await createTestUser("move-task-access-owner");
    const otherOwner = await createTestUser("move-task-access-other-owner");

    const sourceProject = await db.orm.public.Project.create({
      name: `[TEST] Source Project ${Date.now()}`,
      description: "Source project",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    const inaccessibleProject = await db.orm.public.Project.create({
      name: `[TEST] Inaccessible Project ${Date.now()}`,
      description: "Inaccessible project",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: otherOwner.id,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] Move Task Access",
      description: "Testing project access",
      status: 1,
      priority: 2,
      projectId: sourceProject.id,
      creatorId: owner.id,
    });

    const session = await createSession(owner.id);

    const response = await authenticatedRequestWithSession(session.id)
      .patch(`/api/tasks/${task.id}`)
      .send({ projectId: inaccessibleProject.id });

    expect(response.status).toBe(404);

    const unchangedTask = await db.orm.public.Task.where({
      id: task.id,
    }).first();

    expect(unchangedTask!.projectId).toBe(sourceProject.id);

    const activities = await db.orm.public.TaskActivity.where({
      taskId: task.id,
      action: "UPDATED",
      field: "projectId",
    }).all();

    expect(activities).toHaveLength(0);
  });

  it("should not create activity when updating a task with unchanged values", async () => {
    const owner = await createTestUser("unchanged-task-owner");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Unchanged Project ${Date.now()}`,
      description: "Testing unchanged task updates",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] Unchanged Task",
      description: "Same description",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
    });

    const session = await createSession(owner.id);

    const response = await authenticatedRequestWithSession(session.id)
      .patch(`/api/tasks/${task.id}`)
      .send({
        title: task.title,
        description: task.description,
        status: "TODO",
        priority: "MEDIUM",
      });

    expect(response.status).toBe(200);

    const activities = await db.orm.public.TaskActivity.where({
      taskId: task.id,
    }).all();

    expect(activities).toHaveLength(0);
  });

  it("should not create activity when updating a task with unchanged values", async () => {
    const owner = await createTestUser("unchanged-task-owner");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Unchanged Project ${Date.now()}`,
      description: "Testing unchanged task updates",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] Unchanged Task",
      description: "Same description",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
    });

    const session = await createSession(owner.id);

    const response = await authenticatedRequestWithSession(session.id)
      .patch(`/api/tasks/${task.id}`)
      .send({
        title: task.title,
        description: task.description,
        status: "TODO",
        priority: "MEDIUM",
      });

    expect(response.status).toBe(200);

    const activities = await db.orm.public.TaskActivity.where({
      taskId: task.id,
    }).all();

    expect(activities).toHaveLength(0);
  });

  it("should reject updating a soft-deleted task", async () => {
    const owner = await createTestUser("update-deleted-task-owner");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Deleted Task Project ${Date.now()}`,
      description: "Testing deleted task updates",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] Deleted Task",
      description: "Original description",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
      deletedAt: Temporal.Instant.from("2026-10-01T00:00:00Z"),
      deletedById: owner.id,
    });

    const session = await createSession(owner.id);

    const response = await authenticatedRequestWithSession(session.id)
      .patch(`/api/tasks/${task.id}`)
      .send({ title: "Updated title" });

    expect(response.status).toBe(404);

    const unchangedTask = await db.orm.public.Task.where({
      id: task.id,
    }).first();

    expect(unchangedTask!.title).toBe("[TEST] Deleted Task");
  });

  it("should return 404 when updating a nonexistent task", async () => {
    const owner = await createTestUser("update-missing-task-owner");
    const session = await createSession(owner.id);

    const response = await authenticatedRequestWithSession(session.id)
      .patch("/api/tasks/2147483647")
      .send({ title: "Updated title" });

    expect(response.status).toBe(404);
  });

  it("should return 404 when updating a nonexistent task", async () => {
    const owner = await createTestUser("update-missing-task-owner");
    const session = await createSession(owner.id);

    const response = await authenticatedRequestWithSession(session.id)
      .patch("/api/tasks/2147483647")
      .send({ title: "Updated title" });

    expect(response.status).toBe(404);
  });

  it.each(["not-a-date", "2026-13-40", ""])(
    "should reject an invalid due date: %s",
    async (dueDate) => {
      const owner = await createTestUser("invalid-due-date-owner");

      const project = await db.orm.public.Project.create({
        name: `[TEST] Due Date Project ${Date.now()}`,
        description: "Testing due date validation",
        status: "Active",
        startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
        dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
        ownerId: owner.id,
      });

      const task = await db.orm.public.Task.create({
        title: "[TEST] Due Date Validation Task",
        description: "Original description",
        status: 1,
        priority: 2,
        projectId: project.id,
        creatorId: owner.id,
      });

      const session = await createSession(owner.id);

      const response = await authenticatedRequestWithSession(session.id)
        .patch(`/api/tasks/${task.id}`)
        .send({ dueDate });

      expect(response.status).toBe(400);

      const unchangedTask = await db.orm.public.Task.where({
        id: task.id,
      }).first();

      expect(unchangedTask!.dueDate).toBe(task.dueDate);
    },
  );

  it("should reject updating a task when the requester cannot access its project", async () => {
    const owner = await createTestUser("source-access-owner");
    const stranger = await createTestUser("source-access-stranger");

    const project = await db.orm.public.Project.create({
      name: `[TEST] Private Project ${Date.now()}`,
      description: "Private project",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.id,
    });

    const task = await db.orm.public.Task.create({
      title: "[TEST] Private Task",
      description: "Original description",
      status: 1,
      priority: 2,
      projectId: project.id,
      creatorId: owner.id,
    });

    const session = await createSession(stranger.id);

    const response = await authenticatedRequestWithSession(session.id)
      .patch(`/api/tasks/${task.id}`)
      .send({ title: "Unauthorized update" });

    expect(response.status).toBe(404);

    const unchangedTask = await db.orm.public.Task.where({
      id: task.id,
    }).first();

    expect(unchangedTask!.title).toBe("[TEST] Private Task");

    const activities = await db.orm.public.TaskActivity.where({
      taskId: task.id,
      field: "title",
    }).all();

    expect(activities).toHaveLength(0);
  });


});
