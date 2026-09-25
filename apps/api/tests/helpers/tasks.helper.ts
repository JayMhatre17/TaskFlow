import request from "supertest";
import app from "../../src/app";

type CreateTestTaskInput = {
  title?: string;
  description?: string;
  status?: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  projectId: number;
};

export const createTestTask = async (data: CreateTestTaskInput) => {
  const response = await request(app)
    .post("/api/tasks")
    .send({
      title: data.title ?? `[TEST] Task ${Date.now()}`,
      description: data.description ?? "Test task",
      status: data.status ?? "TODO",
      priority: data.priority ?? "MEDIUM",
      dueDate: data.dueDate ?? "2026-12-31",
      projectId: data.projectId,
    });

  if (response.status !== 201) {
    throw new Error(
      `Failed to create test task: ${
        response.status
      } ${JSON.stringify(response.body)}`,
    );
  }

  return response.body;
};
