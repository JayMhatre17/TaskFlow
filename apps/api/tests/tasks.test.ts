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

describe("Task API", () => {
  let createdTaskId: number | undefined;
  let testProjectId: number;
  let sessionA: string;
  let sessionB: string;

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
});
