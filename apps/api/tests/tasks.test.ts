import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";

describe("Task API", () => {
  let createdTaskId: number | undefined;

  afterEach(async () => {
    if (createdTaskId) {
      await request(app).delete(`/api/tasks/${createdTaskId}`);
      createdTaskId = undefined;
    }
  });
  it("should get tasks", async () => {
    const response = await request(app).get("/api/tasks");

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("pagination");
  });

  it("should create a task", async () => {
    const response = await request(app).post("/api/tasks").send({
      title: "[TEST] Automated test task",
      description: "[TEST] Created by Vitest",
      status: "TODO",
      priority: "HIGH",
      projectId: 1,
    });

    expect(response.status).toBe(201);

    expect(response.body).toHaveProperty("id");
    expect(response.body.status).toBe("TODO");
    expect(response.body.priority).toBe("HIGH");

    createdTaskId = response.body.id;
  });
  it("should get a task by id", async () => {
    const createResponse = await request(app).post("/api/tasks").send({
      title: "[TEST] Get task by id",
      description: "[TEST] Created by Vitest",
      status: "TODO",
      priority: "HIGH",
      projectId: 1,
    });

    expect(createResponse.status).toBe(201);

    createdTaskId = createResponse.body.id;

    const response = await request(app).get(`/api/tasks/${createdTaskId}`);

    expect(response.status).toBe(200);

    expect(response.body.id).toBe(createdTaskId);
    expect(response.body.title).toBe("[TEST] Get task by id");
    expect(response.body.status).toBe("TODO");
    expect(response.body.priority).toBe("HIGH");
  });
  it("should return 404 for a non-existent task", async () => {
    const response = await request(app).get("/api/tasks/999999999");

    expect(response.status).toBe(404);
  });
  it("should update a task", async () => {
    const createResponse = await request(app).post("/api/tasks").send({
      title: "[TEST] Update task",
      description: "[TEST] Before update",
      status: "TODO",
      priority: "LOW",
      projectId: 1,
    });

    expect(createResponse.status).toBe(201);

    createdTaskId = createResponse.body.id;

    const response = await request(app)
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
    const createResponse = await request(app).post("/api/tasks").send({
      title: "[TEST] Delete task",
      description: "[TEST] Will be deleted",
      status: "TODO",
      priority: "LOW",
      projectId: 1,
    });

    expect(createResponse.status).toBe(201);

    createdTaskId = createResponse.body.id;

    const deleteResponse = await request(app).delete(
      `/api/tasks/${createdTaskId}`,
    );

    expect(deleteResponse.status).toBe(204);

    // Prevent afterEach from trying to delete it again
    createdTaskId = undefined;

    const getResponse = await request(app).get(
      `/api/tasks/${createResponse.body.id}`,
    );

    expect(getResponse.status).toBe(404);
  });
  it("should reject an invalid task status", async () => {
    const response = await request(app).post("/api/tasks").send({
      title: "[TEST] Invalid status",
      description: "[TEST] Should fail",
      status: "INVALID_STATUS",
      priority: "HIGH",
      projectId: 1,
    });

    expect(response.status).toBe(400);
  });

  it("should reject an invalid task priority", async () => {
    const response = await request(app).post("/api/tasks").send({
      title: "[TEST] Invalid priority",
      description: "[TEST] Should fail",
      status: "TODO",
      priority: "INVALID_PRIORITY",
      projectId: 1,
    });

    expect(response.status).toBe(400);
  });
  it("should reject a task with a non-existent project", async () => {
    const response = await request(app).post("/api/tasks").send({
      title: "[TEST] Invalid project",
      description: "[TEST] Should fail",
      status: "TODO",
      priority: "HIGH",
      projectId: 999999999,
    });

    expect(response.status).toBe(404);
  });

  it("should partially update a task", async () => {
    const createResponse = await request(app).post("/api/tasks").send({
      title: "[TEST] Partial update",
      description: "[TEST] Original description",
      status: "TODO",
      priority: "LOW",
      projectId: 1,
    });

    expect(createResponse.status).toBe(201);

    createdTaskId = createResponse.body.id;

    const updateResponse = await request(app)
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
    expect(updateResponse.body.projectId).toBe(1);
  });
  it("should return 404 when updating a non-existent task", async () => {
    const response = await request(app).patch("/api/tasks/999999999").send({
      status: "IN_PROGRESS",
    });

    expect(response.status).toBe(404);
  });
  it("should filter tasks by status", async () => {
    const todoResponse = await request(app).post("/api/tasks").send({
      title: "[TEST] TODO filter task",
      description: "[TEST] Status filter",
      status: "TODO",
      priority: "LOW",
      projectId: 1,
    });

    expect(todoResponse.status).toBe(201);

    const completedResponse = await request(app).post("/api/tasks").send({
      title: "[TEST] COMPLETED filter task",
      description: "[TEST] Status filter",
      status: "COMPLETED",
      priority: "LOW",
      projectId: 1,
    });

    expect(completedResponse.status).toBe(201);

    createdTaskId = completedResponse.body.id;

    const response = await request(app).get("/api/tasks").query({
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
    await request(app).delete(`/api/tasks/${todoResponse.body.id}`);
  });
  it("should filter tasks by priority", async () => {
    const lowResponse = await request(app).post("/api/tasks").send({
      title: "[TEST] LOW priority filter task",
      description: "[TEST] Priority filter",
      status: "TODO",
      priority: "LOW",
      projectId: 1,
    });

    expect(lowResponse.status).toBe(201);

    const highResponse = await request(app).post("/api/tasks").send({
      title: "[TEST] HIGH priority filter task",
      description: "[TEST] Priority filter",
      status: "TODO",
      priority: "HIGH",
      projectId: 1,
    });

    expect(highResponse.status).toBe(201);

    createdTaskId = highResponse.body.id;

    const response = await request(app).get("/api/tasks").query({
      priority: "LOW",
    });

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);

    expect(
      response.body.data.every(
        (task: { priority: string }) => task.priority === "LOW",
      ),
    ).toBe(true);

    await request(app).delete(`/api/tasks/${lowResponse.body.id}`);
  });
  it("should filter tasks by project", async () => {
    const response = await request(app).get("/api/tasks").query({
      projectId: 1,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);

    expect(
      response.body.data.every(
        (task: { projectId: number }) => task.projectId === 1,
      ),
    ).toBe(true);
  });
  it("should search tasks by title or description", async () => {
    const titleResponse = await request(app).post("/api/tasks").send({
      title: "[TEST] Unique Search Title",
      description: "[TEST] Normal description",
      status: "TODO",
      priority: "LOW",
      projectId: 1,
    });

    expect(titleResponse.status).toBe(201);

    const descriptionResponse = await request(app).post("/api/tasks").send({
      title: "[TEST] Normal title",
      description: "[TEST] Unique Search Description",
      status: "TODO",
      priority: "LOW",
      projectId: 1,
    });

    expect(descriptionResponse.status).toBe(201);

    createdTaskId = descriptionResponse.body.id;

    const titleSearchResponse = await request(app).get("/api/tasks").query({
      search: "Unique Search Title",
    });

    expect(titleSearchResponse.status).toBe(200);

    expect(
      titleSearchResponse.body.data.some(
        (task: { id: number }) => task.id === titleResponse.body.id,
      ),
    ).toBe(true);

    const descriptionSearchResponse = await request(app)
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

    await request(app).delete(`/api/tasks/${titleResponse.body.id}`);
  });
  it("should filter tasks using multiple filters", async () => {
    const matchingTask = await request(app).post("/api/tasks").send({
      title: "[TEST] Combined filter matching task",
      description: "[TEST] Combined filters",
      status: "TODO",
      priority: "HIGH",
      projectId: 1,
    });

    expect(matchingTask.status).toBe(201);

    const statusMismatch = await request(app).post("/api/tasks").send({
      title: "[TEST] Combined filter status mismatch",
      description: "[TEST] Combined filters",
      status: "COMPLETED",
      priority: "HIGH",
      projectId: 1,
    });

    expect(statusMismatch.status).toBe(201);

    const priorityMismatch = await request(app).post("/api/tasks").send({
      title: "[TEST] Combined filter priority mismatch",
      description: "[TEST] Combined filters",
      status: "TODO",
      priority: "LOW",
      projectId: 1,
    });

    expect(priorityMismatch.status).toBe(201);

    createdTaskId = priorityMismatch.body.id;

    const response = await request(app).get("/api/tasks").query({
      status: "TODO",
      priority: "HIGH",
      projectId: 1,
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
          task.projectId === 1,
      ),
    ).toBe(true);

    await request(app).delete(`/api/tasks/${matchingTask.body.id}`);
    await request(app).delete(`/api/tasks/${statusMismatch.body.id}`);
  });
  it("should paginate tasks", async () => {
    const response = await request(app).get("/api/tasks").query({
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
      const response = await request(app)
        .post("/api/tasks")
        .send({
          title: `[TEST] Pagination last page ${i}`,
          description: "[TEST] Pagination",
          status: "TODO",
          priority: "LOW",
          projectId: 1,
        });

      expect(response.status).toBe(201);

      taskIds.push(response.body.id);
    }

    const firstPageResponse = await request(app).get("/api/tasks").query({
      page: 1,
      limit: 2,
    });

    expect(firstPageResponse.status).toBe(200);

    const total = firstPageResponse.body.pagination.total;
    const totalPages = firstPageResponse.body.pagination.totalPages;

    expect(total).toBeGreaterThanOrEqual(5);
    expect(totalPages).toBe(Math.ceil(total / 2));

    const lastPageResponse = await request(app).get("/api/tasks").query({
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
      await request(app).delete(`/api/tasks/${id}`);
    }
  });
  it("should return empty data for a page beyond the last page", async () => {
    const response = await request(app).get("/api/tasks").query({
      page: 1,
      limit: 2,
    });

    expect(response.status).toBe(200);

    const total = response.body.pagination.total;
    const totalPages = response.body.pagination.totalPages;

    expect(totalPages).toBe(Math.ceil(total / 2));

    const beyondLastPageResponse = await request(app)
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
      const response = await request(app)
        .post("/api/tasks")
        .send({
          title: `[TEST] Offset pagination ${i}`,
          description: "[TEST] Offset pagination",
          status: "TODO",
          priority: "LOW",
          projectId: 1,
        });

      expect(response.status).toBe(201);

      taskIds.push(response.body.id);
    }

    const page1Response = await request(app).get("/api/tasks").query({
      page: 1,
      limit: 2,
    });

    expect(page1Response.status).toBe(200);

    const page2Response = await request(app).get("/api/tasks").query({
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
      await request(app).delete(`/api/tasks/${id}`);
    }
  });
  it("should paginate filtered tasks", async () => {
    const taskIds: number[] = [];

    for (let i = 1; i <= 5; i++) {
      const response = await request(app)
        .post("/api/tasks")
        .send({
          title: `[TEST] Filter pagination ${i}`,
          description: "[TEST] Filter pagination",
          status: "TODO",
          priority: "LOW",
          projectId: 1,
        });

      expect(response.status).toBe(201);

      taskIds.push(response.body.id);
    }

    const response = await request(app).get("/api/tasks").query({
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
      await request(app).delete(`/api/tasks/${id}`);
    }
  });
  it("should reject page 0", async () => {
    const response = await request(app).get("/api/tasks").query({
      page: 0,
      limit: 2,
    });

    expect(response.status).toBe(400);
  });
  it("should reject limit 0", async () => {
    const response = await request(app).get("/api/tasks").query({
      page: 1,
      limit: 0,
    });

    expect(response.status).toBe(400);
  });
  it("should reject a negative page", async () => {
    const response = await request(app).get("/api/tasks").query({
      page: -1,
      limit: 2,
    });

    expect(response.status).toBe(400);
  });
  it("should reject a negative limit", async () => {
    const response = await request(app).get("/api/tasks").query({
      page: 1,
      limit: -5,
    });

    expect(response.status).toBe(400);
  });
  it("should sort tasks by title in ascending order", async () => {
    const taskIds: number[] = [];

    const titles = ["[TEST] Charlie", "[TEST] Alpha", "[TEST] Bravo"];

    for (const title of titles) {
      const response = await request(app).post("/api/tasks").send({
        title,
        description: "[TEST] Sorting",
        status: "TODO",
        priority: "LOW",
        projectId: 1,
      });

      expect(response.status).toBe(201);

      taskIds.push(response.body.id);
    }

    const response = await request(app).get("/api/tasks").query({
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
      await request(app).delete(`/api/tasks/${id}`);
    }
  });
  it("should sort tasks by title in descending order", async () => {
    const taskIds: number[] = [];

    const titles = ["[TEST] Charlie", "[TEST] Alpha", "[TEST] Bravo"];

    for (const title of titles) {
      const response = await request(app).post("/api/tasks").send({
        title,
        description: "[TEST] Sorting",
        status: "TODO",
        priority: "LOW",
        projectId: 1,
      });

      expect(response.status).toBe(201);

      taskIds.push(response.body.id);
    }

    const response = await request(app).get("/api/tasks").query({
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
      await request(app).delete(`/api/tasks/${id}`);
    }
  });
  it("should sort tasks by priority in ascending order", async () => {
    const taskIds: number[] = [];

    const priorities = ["HIGH", "LOW", "URGENT", "MEDIUM"];

    for (let i = 0; i < priorities.length; i++) {
      const response = await request(app)
        .post("/api/tasks")
        .send({
          title: `[TEST] Priority sorting ${i + 1}`,
          description: "[TEST] Priority sorting",
          status: "TODO",
          priority: priorities[i],
          projectId: 1,
        });

      expect(response.status).toBe(201);

      taskIds.push(response.body.id);
    }

    const response = await request(app).get("/api/tasks").query({
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
      await request(app).delete(`/api/tasks/${id}`);
    }
  });
  it("should sort tasks by priority in descending order", async () => {
    const taskIds: number[] = [];

    const priorities = ["HIGH", "LOW", "URGENT", "MEDIUM"];

    for (let i = 0; i < priorities.length; i++) {
      const response = await request(app)
        .post("/api/tasks")
        .send({
          title: `[TEST] Priority descending ${i + 1}`,
          description: "[TEST] Priority sorting",
          status: "TODO",
          priority: priorities[i],
          projectId: 1,
        });

      expect(response.status).toBe(201);

      taskIds.push(response.body.id);
    }

    const response = await request(app).get("/api/tasks").query({
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
      await request(app).delete(`/api/tasks/${id}`);
    }
  });
  it("should reject a task without a title", async () => {
    const response = await request(app).post("/api/tasks").send({
      description: "[TEST] Missing title",
      status: "TODO",
      priority: "LOW",
      projectId: 1,
    });

    expect(response.status).toBe(400);
  });
  it("should reject a task with an empty title", async () => {
    const response = await request(app).post("/api/tasks").send({
      title: "",
      description: "[TEST] Empty title",
      status: "TODO",
      priority: "LOW",
      projectId: 1,
    });

    expect(response.status).toBe(400);
  });
  it("should reject a task with a whitespace-only title", async () => {
    const response = await request(app).post("/api/tasks").send({
      title: "   ",
      description: "[TEST] Whitespace title",
      status: "TODO",
      priority: "LOW",
      projectId: 1,
    });

    expect(response.status).toBe(400);
  });
  it("should reject an invalid projectId", async () => {
    const response = await request(app).post("/api/tasks").send({
      title: "[TEST] Invalid project id",
      description: "[TEST] Invalid project id",
      status: "TODO",
      priority: "LOW",
      projectId: "invalid",
    });

    expect(response.status).toBe(400);
  });
  it("should reject updating a task with a non-existent project", async () => {
    const createResponse = await request(app).post("/api/tasks").send({
      title: "[TEST] Invalid update project",
      description: "[TEST] Update project",
      status: "TODO",
      priority: "LOW",
      projectId: 1,
    });

    expect(createResponse.status).toBe(201);

    const taskId = createResponse.body.id;

    const updateResponse = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .send({
        projectId: 999999999,
      });

    expect(updateResponse.status).toBe(404);

    await request(app).delete(`/api/tasks/${taskId}`);
  });
  it("should create a task with a due date", async () => {
    const response = await request(app).post("/api/tasks").send({
      title: "[TEST] Due date task",
      description: "[TEST] Due date",
      status: "TODO",
      priority: "LOW",
      dueDate: "2026-12-31",
      projectId: 1,
    });

    expect(response.status).toBe(201);
    expect(response.body.dueDate).toBeDefined();

    const taskId = response.body.id;

    await request(app).delete(`/api/tasks/${taskId}`);
  });
  it("should reject an invalid due date", async () => {
    const response = await request(app).post("/api/tasks").send({
      title: "[TEST] Invalid due date",
      description: "[TEST] Invalid due date",
      status: "TODO",
      priority: "LOW",
      dueDate: "not-a-date",
      projectId: 1,
    });

    expect(response.status).toBe(400);
  });
  it("should reject an invalid sort field", async () => {
    const response = await request(app).get("/api/tasks").query({
      sortBy: "invalidField",
      sortOrder: "asc",
    });

    expect(response.status).toBe(400);
  });
  it("should reject an invalid sort order", async () => {
    const response = await request(app).get("/api/tasks").query({
      sortBy: "title",
      sortOrder: "invalid",
    });

    expect(response.status).toBe(400);
  });
});
