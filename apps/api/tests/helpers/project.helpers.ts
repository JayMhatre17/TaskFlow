import request from "supertest";
import app from "../../src/app";

type CreateTestProjectInput = {
  name?: string;
  description?: string;
  status?: "Active" | "On Hold";
  startDate?: string;
  dueDate?: string;
};

export const createTestProject = async (data: CreateTestProjectInput = {}) => {
  const response = await request(app)
    .post("/api/projects")
    .send({
      name: data.name ?? `[TEST] Project ${Date.now()}`,
      description: data.description ?? "Test project",
      status: data.status ?? "Active",
      startDate: data.startDate ?? "2026-01-01",
      dueDate: data.dueDate ?? "2026-12-31",
    });

  if (response.status !== 201) {
    throw new Error(
      `Failed to create test project: ${response.status} ${JSON.stringify(
        response.body,
      )}`,
    );
  }

  return response.body;
};

export const deleteTestProject = async (id: number) => {
  const response = await request(app).delete(`/api/projects/${id}`);

  if (response.status !== 204 && response.status !== 404) {
    throw new Error(
      `Failed to delete test project ${id}: ${
        response.status
      } ${JSON.stringify(response.body)}`,
    );
  }
};

export const createTestProjects = async (
  projects: CreateTestProjectInput[],
) => {
  const createdProjects = [];

  for (const project of projects) {
    const createdProject = await createTestProject(project);
    createdProjects.push(createdProject);
  }

  return createdProjects;
};
