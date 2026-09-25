import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import app from "../src/app";
import {
  createTestProject,
  createTestProjects,
  deleteTestProject,
} from "./helpers/project.helpers";
import { createTestTask } from "./helpers/tasks.helper";

describe("GET /api/projects", () => {
  const createdProjectIds: number[] = [];

  afterEach(async () => {
    for (const id of createdProjectIds) {
      await deleteTestProject(id);
    }

    createdProjectIds.length = 0;
  });

  it("should return projects successfully", async () => {
    const project = await createTestProject({
      name: "[TEST] GET Projects",
    });

    createdProjectIds.push(project.id);

    const response = await request(app).get("/api/projects");

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("pagination");

    expect(Array.isArray(response.body.data)).toBe(true);

    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 10,
    });

    expect(response.body.pagination).toHaveProperty("total");
    expect(response.body.pagination).toHaveProperty("totalPages");

    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: project.id,
          name: "[TEST] GET Projects",
        }),
      ]),
    );
  });
  it("should return projects with the requested pagination", async () => {
    const project = await createTestProject({
      name: "[TEST] Pagination Project",
    });

    createdProjectIds.push(project.id);

    const response = await request(app).get("/api/projects").query({
      page: 1,
      limit: 1,
    });

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("pagination");

    expect(Array.isArray(response.body.data)).toBe(true);

    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 1,
    });

    expect(response.body.pagination).toHaveProperty("total");
    expect(response.body.pagination).toHaveProperty("totalPages");

    expect(response.body.data.length).toBeLessThanOrEqual(1);
  });
  it("should return different projects on page 2", async () => {
    const projects = await createTestProjects([
      { name: "[TEST] Pagination Project 1" },
      { name: "[TEST] Pagination Project 2" },
    ]);

    createdProjectIds.push(...projects.map((project) => project.id));

    const page1Response = await request(app).get("/api/projects").query({
      page: 1,
      limit: 1,
    });

    const page2Response = await request(app).get("/api/projects").query({
      page: 2,
      limit: 1,
    });

    expect(page1Response.status).toBe(200);
    expect(page2Response.status).toBe(200);

    expect(page1Response.body.pagination).toMatchObject({
      page: 1,
      limit: 1,
    });

    expect(page2Response.body.pagination).toMatchObject({
      page: 2,
      limit: 1,
    });

    expect(page1Response.body.data).toHaveLength(1);
    expect(page2Response.body.data).toHaveLength(1);

    expect(page1Response.body.data[0].id).not.toBe(
      page2Response.body.data[0].id,
    );
  });
  it("should return different projects on page 2", async () => {
    const search = `TEST-PAGINATION-${Date.now()}`;

    const projects = await createTestProjects([
      {
        name: `${search} Project 1`,
      },
      {
        name: `${search} Project 2`,
      },
    ]);

    createdProjectIds.push(...projects.map((project) => project.id));

    const page1Response = await request(app).get("/api/projects").query({
      search,
      page: 1,
      limit: 1,
    });

    const page2Response = await request(app).get("/api/projects").query({
      search,
      page: 2,
      limit: 1,
    });

    expect(page1Response.status).toBe(200);
    expect(page2Response.status).toBe(200);

    expect(page1Response.body.data).toHaveLength(1);
    expect(page2Response.body.data).toHaveLength(1);

    expect(page1Response.body.data[0].id).not.toBe(
      page2Response.body.data[0].id,
    );

    expect(page1Response.body.pagination).toMatchObject({
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2,
    });

    expect(page2Response.body.pagination).toMatchObject({
      page: 2,
      limit: 1,
      total: 2,
      totalPages: 2,
    });
  });
  it("should return different projects on page 2", async () => {
    const search = `TEST-PAGINATION-${Date.now()}`;

    const projects = await createTestProjects([
      {
        name: `${search} Project 1`,
      },
      {
        name: `${search} Project 2`,
      },
    ]);

    createdProjectIds.push(...projects.map((project) => project.id));

    const page1Response = await request(app).get("/api/projects").query({
      search,
      page: 1,
      limit: 1,
    });

    const page2Response = await request(app).get("/api/projects").query({
      search,
      page: 2,
      limit: 1,
    });

    expect(page1Response.status).toBe(200);
    expect(page2Response.status).toBe(200);

    expect(page1Response.body.data).toHaveLength(1);
    expect(page2Response.body.data).toHaveLength(1);

    expect(page1Response.body.pagination).toMatchObject({
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2,
    });

    expect(page2Response.body.pagination).toMatchObject({
      page: 2,
      limit: 1,
      total: 2,
      totalPages: 2,
    });

    expect(page1Response.body.data[0].id).not.toBe(
      page2Response.body.data[0].id,
    );
  });
  it("should return projects matching the search term in name", async () => {
    const search = `TEST-SEARCH-NAME-${Date.now()}`;

    const matchingProject = await createTestProject({
      name: `${search} Project`,
    });

    const nonMatchingProject = await createTestProject({
      name: "Completely Different Project",
    });

    createdProjectIds.push(matchingProject.id, nonMatchingProject.id);

    const response = await request(app).get("/api/projects").query({
      search,
    });

    expect(response.status).toBe(200);

    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0]).toMatchObject({
      id: matchingProject.id,
      name: `${search} Project`,
    });

    expect(response.body.pagination.total).toBe(1);
    expect(response.body.pagination.totalPages).toBe(1);
  });
  it("should return projects matching the search term in description", async () => {
    const search = `TEST-SEARCH-DESCRIPTION-${Date.now()}`;

    const matchingProject = await createTestProject({
      name: "Unrelated Project Name",
      description: `Project description containing ${search}`,
    });

    const nonMatchingProject = await createTestProject({
      name: "Another Project",
      description: "Completely unrelated description",
    });

    createdProjectIds.push(matchingProject.id, nonMatchingProject.id);

    const response = await request(app).get("/api/projects").query({
      search,
    });

    expect(response.status).toBe(200);

    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0]).toMatchObject({
      id: matchingProject.id,
      name: "Unrelated Project Name",
    });

    expect(response.body.pagination.total).toBe(1);
    expect(response.body.pagination.totalPages).toBe(1);
  });
  it("should return projects matching the search term in name or description", async () => {
    const search = `TEST-SEARCH-OR-${Date.now()}`;

    const nameMatch = await createTestProject({
      name: `${search} Name Match`,
      description: "Unrelated description",
    });

    const descriptionMatch = await createTestProject({
      name: "Unrelated Name",
      description: `${search} Description Match`,
    });

    const noMatch = await createTestProject({
      name: "Completely Unrelated",
      description: "Nothing relevant here",
    });

    createdProjectIds.push(nameMatch.id, descriptionMatch.id, noMatch.id);

    const response = await request(app).get("/api/projects").query({
      search,
    });

    expect(response.status).toBe(200);

    expect(response.body.data).toHaveLength(2);

    expect(response.body.pagination.total).toBe(2);
    expect(response.body.pagination.totalPages).toBe(1);

    const returnedIds = response.body.data.map(
      (project: { id: number }) => project.id,
    );

    expect(returnedIds).toContain(nameMatch.id);
    expect(returnedIds).toContain(descriptionMatch.id);
    expect(returnedIds).not.toContain(noMatch.id);
  });
  it("should search projects case-insensitively", async () => {
    const search = `TEST-SEARCH-CASE-${Date.now()}`;

    const project = await createTestProject({
      name: `${search} Project`,
    });

    createdProjectIds.push(project.id);

    const response = await request(app).get("/api/projects").query({
      search: search.toLowerCase(),
    });

    expect(response.status).toBe(200);

    expect(response.body.pagination.total).toBe(1);

    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: project.id,
        }),
      ]),
    );
  });
  it("should paginate filtered search results", async () => {
    const search = `TEST-SEARCH-PAGINATION-${Date.now()}`;

    const projects = await createTestProjects([
      {
        name: `${search} Project 1`,
      },
      {
        name: `${search} Project 2`,
      },
      {
        name: `${search} Project 3`,
      },
    ]);

    const unrelatedProject = await createTestProject({
      name: "Completely Unrelated Project",
    });

    createdProjectIds.push(
      ...projects.map((project) => project.id),
      unrelatedProject.id,
    );

    const page1Response = await request(app).get("/api/projects").query({
      search,
      page: 1,
      limit: 2,
    });

    const page2Response = await request(app).get("/api/projects").query({
      search,
      page: 2,
      limit: 2,
    });

    expect(page1Response.status).toBe(200);
    expect(page2Response.status).toBe(200);

    expect(page1Response.body.data).toHaveLength(2);
    expect(page2Response.body.data).toHaveLength(1);

    expect(page1Response.body.pagination).toMatchObject({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
    });

    expect(page2Response.body.pagination).toMatchObject({
      page: 2,
      limit: 2,
      total: 3,
      totalPages: 2,
    });

    const page1Ids = page1Response.body.data.map(
      (project: { id: number }) => project.id,
    );

    const page2Ids = page2Response.body.data.map(
      (project: { id: number }) => project.id,
    );

    expect(page1Ids).toHaveLength(2);
    expect(page2Ids).toHaveLength(1);

    expect(page1Ids).not.toContain(page2Ids[0]);

    for (const id of projects.map((project) => project.id)) {
      expect([...page1Ids, ...page2Ids]).toContain(id);
    }

    expect([...page1Ids, ...page2Ids]).not.toContain(unrelatedProject.id);
  });
  it("should filter projects by status", async () => {
    const search = `TEST-ACTIVE-${Date.now()}`;

    const activeProject = await createTestProject({
      name: `${search} Active Project`,
      status: "Active",
    });

    const onHoldProject = await createTestProject({
      name: `${search} On Hold Project`,
      status: "On Hold",
    });

    createdProjectIds.push(activeProject.id, onHoldProject.id);

    const response = await request(app).get("/api/projects").query({
      search,
      status: "Active",
    });

    expect(response.status).toBe(200);

    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0]).toMatchObject({
      id: activeProject.id,
      name: activeProject.name,
      status: "Active",
    });

    expect(response.body.pagination).toMatchObject({
      total: 1,
      totalPages: 1,
    });

    expect(response.body.data).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: onHoldProject.id,
        }),
      ]),
    );
  });
  it("should filter projects by On Hold status", async () => {
    const search = `TEST-ON-HOLD-${Date.now()}`;

    const activeProject = await createTestProject({
      name: `${search} Active Project`,
      status: "Active",
    });

    const onHoldProject = await createTestProject({
      name: `${search} On Hold Project`,
      status: "On Hold",
    });

    createdProjectIds.push(activeProject.id, onHoldProject.id);

    const response = await request(app).get("/api/projects").query({
      search,
      status: "On Hold",
    });

    expect(response.status).toBe(200);

    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0]).toMatchObject({
      id: onHoldProject.id,
      name: onHoldProject.name,
      status: "On Hold",
    });

    expect(response.body.pagination).toMatchObject({
      total: 1,
      totalPages: 1,
    });

    expect(response.body.data).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: activeProject.id,
        }),
      ]),
    );
  });
  it("should filter projects by search and status together", async () => {
    const search = `TEST-COMBINED-${Date.now()}`;

    const matchingProject = await createTestProject({
      name: `${search} Active Project`,
      status: "Active",
    });

    const wrongStatusProject = await createTestProject({
      name: `${search} On Hold Project`,
      status: "On Hold",
    });

    const wrongSearchProject = await createTestProject({
      name: "Unrelated Active Project",
      status: "Active",
    });

    createdProjectIds.push(
      matchingProject.id,
      wrongStatusProject.id,
      wrongSearchProject.id,
    );

    const response = await request(app).get("/api/projects").query({
      search,
      status: "Active",
    });

    expect(response.status).toBe(200);

    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0]).toMatchObject({
      id: matchingProject.id,
      name: matchingProject.name,
      status: "Active",
    });

    expect(response.body.pagination).toMatchObject({
      total: 1,
      totalPages: 1,
    });

    expect(response.body.data).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: wrongStatusProject.id,
        }),
      ]),
    );

    expect(response.body.data).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: wrongSearchProject.id,
        }),
      ]),
    );
  });
  it("should apply search and status filters together", async () => {
    const search = `TEST-COMBINED-${Date.now()}`;

    const matchingProject = await createTestProject({
      name: `${search} Active Project`,
      status: "Active",
    });

    const wrongStatusProject = await createTestProject({
      name: `${search} On Hold Project`,
      status: "On Hold",
    });

    const wrongSearchProject = await createTestProject({
      name: "Unrelated Active Project",
      status: "Active",
    });

    createdProjectIds.push(
      matchingProject.id,
      wrongStatusProject.id,
      wrongSearchProject.id,
    );

    const response = await request(app).get("/api/projects").query({
      search,
      status: "Active",
    });

    expect(response.status).toBe(200);

    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0]).toMatchObject({
      id: matchingProject.id,
      name: matchingProject.name,
      status: "Active",
    });

    expect(response.body.pagination).toMatchObject({
      total: 1,
      totalPages: 1,
    });

    expect(response.body.data).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: wrongStatusProject.id,
        }),
      ]),
    );

    expect(response.body.data).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: wrongSearchProject.id,
        }),
      ]),
    );
  });
  it("should sort projects by name in ascending order", async () => {
    const search = `TEST-SORT-NAME-${Date.now()}`;

    const projectB = await createTestProject({
      name: `${search} B Project`,
    });

    const projectA = await createTestProject({
      name: `${search} A Project`,
    });

    createdProjectIds.push(projectB.id, projectA.id);

    const response = await request(app).get("/api/projects").query({
      search,
      sortBy: "name",
      sortOrder: "asc",
    });

    expect(response.status).toBe(200);

    expect(response.body.data).toHaveLength(2);

    expect(response.body.data[0]).toMatchObject({
      id: projectA.id,
      name: projectA.name,
    });

    expect(response.body.data[1]).toMatchObject({
      id: projectB.id,
      name: projectB.name,
    });

    expect(response.body.pagination).toMatchObject({
      total: 2,
      totalPages: 1,
    });
  });
  it("should sort projects by name in descending order", async () => {
    const search = `TEST-SORT-NAME-DESC-${Date.now()}`;

    const projectA = await createTestProject({
      name: `${search} A Project`,
    });

    const projectB = await createTestProject({
      name: `${search} B Project`,
    });

    createdProjectIds.push(projectA.id, projectB.id);

    const response = await request(app).get("/api/projects").query({
      search,
      sortBy: "name",
      sortOrder: "desc",
    });

    expect(response.status).toBe(200);

    expect(response.body.data).toHaveLength(2);

    expect(response.body.data[0]).toMatchObject({
      id: projectB.id,
      name: projectB.name,
    });

    expect(response.body.data[1]).toMatchObject({
      id: projectA.id,
      name: projectA.name,
    });

    expect(response.body.pagination).toMatchObject({
      total: 2,
      totalPages: 1,
    });
  });
  it("should sort projects by status in ascending and descending order", async () => {
    const search = `TEST-SORT-STATUS-${Date.now()}`;

    const activeProject = await createTestProject({
      name: `${search} Active Project`,
      status: "Active",
    });

    const onHoldProject = await createTestProject({
      name: `${search} On Hold Project`,
      status: "On Hold",
    });

    createdProjectIds.push(activeProject.id, onHoldProject.id);

    const ascendingResponse = await request(app).get("/api/projects").query({
      search,
      sortBy: "status",
      sortOrder: "asc",
    });

    expect(ascendingResponse.status).toBe(200);
    expect(ascendingResponse.body.data).toHaveLength(2);

    expect(
      ascendingResponse.body.data.map((project: { id: number }) => project.id),
    ).toEqual([activeProject.id, onHoldProject.id]);

    expect(ascendingResponse.body.pagination).toMatchObject({
      total: 2,
      totalPages: 1,
    });

    const descendingResponse = await request(app).get("/api/projects").query({
      search,
      sortBy: "status",
      sortOrder: "desc",
    });

    expect(descendingResponse.status).toBe(200);
    expect(descendingResponse.body.data).toHaveLength(2);

    expect(
      descendingResponse.body.data.map((project: { id: number }) => project.id),
    ).toEqual([onHoldProject.id, activeProject.id]);

    expect(descendingResponse.body.pagination).toMatchObject({
      total: 2,
      totalPages: 1,
    });
  });
  it("should sort projects by startDate in ascending and descending order", async () => {
    const search = `TEST-SORT-START-DATE-${Date.now()}`;

    const earlyProject = await createTestProject({
      name: `${search} Early Project`,
      startDate: "2026-01-01",
    });

    const lateProject = await createTestProject({
      name: `${search} Late Project`,
      startDate: "2026-06-01",
    });

    createdProjectIds.push(earlyProject.id, lateProject.id);

    const ascendingResponse = await request(app).get("/api/projects").query({
      search,
      sortBy: "startDate",
      sortOrder: "asc",
    });

    expect(ascendingResponse.status).toBe(200);
    expect(ascendingResponse.body.data).toHaveLength(2);

    expect(
      ascendingResponse.body.data.map((project: { id: number }) => project.id),
    ).toEqual([earlyProject.id, lateProject.id]);

    expect(ascendingResponse.body.pagination).toMatchObject({
      total: 2,
      totalPages: 1,
    });

    const descendingResponse = await request(app).get("/api/projects").query({
      search,
      sortBy: "startDate",
      sortOrder: "desc",
    });

    expect(descendingResponse.status).toBe(200);
    expect(descendingResponse.body.data).toHaveLength(2);

    expect(
      descendingResponse.body.data.map((project: { id: number }) => project.id),
    ).toEqual([lateProject.id, earlyProject.id]);

    expect(descendingResponse.body.pagination).toMatchObject({
      total: 2,
      totalPages: 1,
    });
  });
  it("should sort projects by dueDate in ascending and descending order", async () => {
    const search = `TEST-SORT-DUE-DATE-${Date.now()}`;

    const earlyProject = await createTestProject({
      name: `${search} Early Project`,
      dueDate: "2026-03-01",
    });

    const lateProject = await createTestProject({
      name: `${search} Late Project`,
      dueDate: "2026-09-01",
    });

    createdProjectIds.push(earlyProject.id, lateProject.id);

    const ascendingResponse = await request(app).get("/api/projects").query({
      search,
      sortBy: "dueDate",
      sortOrder: "asc",
    });

    expect(ascendingResponse.status).toBe(200);
    expect(ascendingResponse.body.data).toHaveLength(2);

    expect(
      ascendingResponse.body.data.map((project: { id: number }) => project.id),
    ).toEqual([earlyProject.id, lateProject.id]);

    expect(ascendingResponse.body.pagination).toMatchObject({
      total: 2,
      totalPages: 1,
    });

    const descendingResponse = await request(app).get("/api/projects").query({
      search,
      sortBy: "dueDate",
      sortOrder: "desc",
    });

    expect(descendingResponse.status).toBe(200);
    expect(descendingResponse.body.data).toHaveLength(2);

    expect(
      descendingResponse.body.data.map((project: { id: number }) => project.id),
    ).toEqual([lateProject.id, earlyProject.id]);

    expect(descendingResponse.body.pagination).toMatchObject({
      total: 2,
      totalPages: 1,
    });
  });
  it.each([
    ["0", "zero"],
    ["-1", "negative"],
  ])("should reject invalid page value: %s", async (page) => {
    const response = await request(app).get("/api/projects").query({
      page,
    });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty("message", "Validation failed");
    expect(response.body.errors).toHaveProperty("page");
  });
  it.each([
    ["0", "zero"],
    ["-1", "negative"],
    ["101", "above maximum"],
  ])("should reject invalid limit value: %s", async (limit) => {
    const response = await request(app).get("/api/projects").query({
      limit,
    });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty("message", "Validation failed");
    expect(response.body.errors).toHaveProperty("limit");
  });
  it("should reject an invalid status", async () => {
    const response = await request(app).get("/api/projects").query({
      status: "Completed",
    });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty("message", "Validation failed");
    expect(response.body.errors).toHaveProperty("status");
  });
  it("should reject an invalid sortBy value", async () => {
    const response = await request(app).get("/api/projects").query({
      sortBy: "invalidField",
    });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty("message", "Validation failed");
    expect(response.body.errors).toHaveProperty("sortBy");
  });
  it("should reject an invalid sortOrder value", async () => {
    const response = await request(app).get("/api/projects").query({
      sortOrder: "random",
    });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty("message", "Validation failed");
    expect(response.body.errors).toHaveProperty("sortOrder");
  });
  it("should return an empty data array when requesting a page beyond the last page", async () => {
    const search = `TEST-PAGE-BEYOND-${Date.now()}`;

    const projects = await createTestProjects([
      {
        name: `${search} Project 1`,
      },
      {
        name: `${search} Project 2`,
      },
      {
        name: `${search} Project 3`,
      },
    ]);

    createdProjectIds.push(...projects.map((project) => project.id));

    const response = await request(app).get("/api/projects").query({
      search,
      page: 3,
      limit: 2,
    });

    expect(response.status).toBe(200);

    expect(response.body.data).toEqual([]);

    expect(response.body.pagination).toMatchObject({
      page: 3,
      limit: 2,
      total: 3,
      totalPages: 2,
    });
  });
  describe("GET /api/projects/:id", () => {
    const createdProjectIds: number[] = [];

    afterEach(async () => {
      for (const id of createdProjectIds) {
        await deleteTestProject(id);
      }

      createdProjectIds.length = 0;
    });

    it("should return a project successfully", async () => {
      const project = await createTestProject({
        name: `[TEST] Get Project ${Date.now()}`,
      });

      createdProjectIds.push(project.id);

      const response = await request(app).get(`/api/projects/${project.id}`);

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
      });
    });

    it("should return 404 when the project does not exist", async () => {
      const response = await request(app).get("/api/projects/999999999");

      expect(response.status).toBe(404);

      expect(response.body).toMatchObject({
        message: "Project not found",
      });
    });

    it("should return 400 for an invalid project ID", async () => {
      const response = await request(app).get("/api/projects/invalid");

      expect(response.status).toBe(400);

      expect(response.body).toHaveProperty("message", "Invalid project ID");
    });
  });
  describe("POST /api/projects", () => {
    const createdProjectIds: number[] = [];

    afterEach(async () => {
      for (const id of createdProjectIds) {
        await deleteTestProject(id);
      }

      createdProjectIds.length = 0;
    });

    it("should create a project successfully", async () => {
      const projectData = {
        name: `[TEST] Create Project ${Date.now()}`,
        description: "Project created by API test",
        status: "Active" as const,
        startDate: "2026-01-01",
        dueDate: "2026-12-31",
      };

      const response = await request(app)
        .post("/api/projects")
        .send(projectData);

      expect(response.status).toBe(201);

      expect(response.body).toMatchObject({
        name: projectData.name,
        description: projectData.description,
        status: projectData.status,
      });

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("startDate");
      expect(response.body).toHaveProperty("dueDate");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");

      expect(typeof response.body.id).toBe("number");

      createdProjectIds.push(response.body.id);
    });
  });
  it("should reject a project when name is missing", async () => {
    const response = await request(app).post("/api/projects").send({
      description: "Project without a name",
      status: "Active",
      startDate: "2026-01-01",
      dueDate: "2026-12-31",
    });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty("message", "Validation failed");

    expect(response.body.errors).toHaveProperty("name");
  });
  it("should reject a project when name is empty", async () => {
    const response = await request(app).post("/api/projects").send({
      name: "",
      description: "Project with empty name",
      status: "Active",
      startDate: "2026-01-01",
      dueDate: "2026-12-31",
    });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty("message", "Validation failed");

    expect(response.body.errors).toHaveProperty("name");
  });
  it("should reject a project when name contains only whitespace", async () => {
    const response = await request(app).post("/api/projects").send({
      name: "   ",
      description: "Project with whitespace name",
      status: "Active",
      startDate: "2026-01-01",
      dueDate: "2026-12-31",
    });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty("message", "Validation failed");

    expect(response.body.errors).toHaveProperty("name");
  });
  it("should reject a project with an invalid status", async () => {
    const response = await request(app)
      .post("/api/projects")
      .send({
        name: `[TEST] Invalid Status ${Date.now()}`,
        description: "Project with invalid status",
        status: "Completed",
        startDate: "2026-01-01",
        dueDate: "2026-12-31",
      });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty("message", "Validation failed");

    expect(response.body.errors).toHaveProperty("status");
  });
  it("should reject a project when status is missing", async () => {
    const response = await request(app)
      .post("/api/projects")
      .send({
        name: `[TEST] Missing Status ${Date.now()}`,
        description: "Project without status",
        startDate: "2026-01-01",
        dueDate: "2026-12-31",
      });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty("message", "Validation failed");

    expect(response.body.errors).toHaveProperty("status");
  });
  it("should reject a project when startDate is missing", async () => {
    const response = await request(app)
      .post("/api/projects")
      .send({
        name: `[TEST] Missing Start Date ${Date.now()}`,
        description: "Project without start date",
        status: "Active",
        dueDate: "2026-12-31",
      });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty("message", "Validation failed");

    expect(response.body.errors).toHaveProperty("startDate");
  });
  it("should reject a project when dueDate is missing", async () => {
    const response = await request(app)
      .post("/api/projects")
      .send({
        name: `[TEST] Missing Due Date ${Date.now()}`,
        description: "Project without due date",
        status: "Active",
        startDate: "2026-01-01",
      });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty("message", "Validation failed");

    expect(response.body.errors).toHaveProperty("dueDate");
  });
  it("should reject an invalid startDate", async () => {
    const response = await request(app)
      .post("/api/projects")
      .send({
        name: `[TEST] Invalid Start Date ${Date.now()}`,
        description: "Project with invalid start date",
        status: "Active",
        startDate: "invalid-date",
        dueDate: "2026-12-31",
      });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty("message", "Validation failed");

    expect(response.body.errors).toHaveProperty("startDate");
  });
  it("should reject an invalid dueDate", async () => {
    const response = await request(app)
      .post("/api/projects")
      .send({
        name: `[TEST] Invalid Due Date ${Date.now()}`,
        description: "Project with invalid due date",
        status: "Active",
        startDate: "2026-01-01",
        dueDate: "invalid-date",
      });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty("message", "Validation failed");

    expect(response.body.errors).toHaveProperty("dueDate");
  });
  it("should return validation errors for multiple missing fields", async () => {
    const response = await request(app).post("/api/projects").send({
      description: "Incomplete project",
    });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty("message", "Validation failed");

    expect(response.body.errors).toHaveProperty("name");
    expect(response.body.errors).toHaveProperty("status");
    expect(response.body.errors).toHaveProperty("startDate");
    expect(response.body.errors).toHaveProperty("dueDate");
  });
  it("should create an On Hold project successfully", async () => {
    const projectData = {
      name: `[TEST] On Hold Project ${Date.now()}`,
      description: "On Hold project created by API test",
      status: "On Hold" as const,
      startDate: "2026-02-01",
      dueDate: "2026-11-30",
    };

    const response = await request(app).post("/api/projects").send(projectData);

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      name: projectData.name,
      description: projectData.description,
      status: projectData.status,
    });

    expect(response.body).toHaveProperty("id");

    createdProjectIds.push(response.body.id);
  });
  it("should create a project without a description", async () => {
    const projectData = {
      name: `[TEST] No Description ${Date.now()}`,
      status: "Active" as const,
      startDate: "2026-01-01",
      dueDate: "2026-12-31",
    };

    const response = await request(app).post("/api/projects").send(projectData);

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      name: projectData.name,
      status: projectData.status,
    });

    expect(response.body).toHaveProperty("id");

    createdProjectIds.push(response.body.id);
  });
  it("should create a project with the requested dates", async () => {
    const projectData = {
      name: `[TEST] Date Project ${Date.now()}`,
      description: "Date test project",
      status: "Active" as const,
      startDate: "2026-03-15",
      dueDate: "2026-10-20",
    };

    const response = await request(app).post("/api/projects").send(projectData);

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      name: projectData.name,
      status: projectData.status,
    });

    expect(response.body.startDate).toContain("2026-03-15");
    expect(response.body.dueDate).toContain("2026-10-20");

    createdProjectIds.push(response.body.id);
  });
  it("should return project options successfully", async () => {
    const search = `TEST-OPTIONS-${Date.now()}`;

    const project = await createTestProject({
      name: search,
    });

    createdProjectIds.push(project.id);

    const response = await request(app).get("/api/projects/options");

    expect(response.status).toBe(200);

    expect(Array.isArray(response.body)).toBe(true);

    expect(response.body).toEqual(
      expect.arrayContaining([
        {
          id: project.id,
          name: project.name,
        },
      ]),
    );
  });
});
describe("GET /api/projects/options", () => {
  const createdProjectIds: number[] = [];

  afterEach(async () => {
    for (const id of createdProjectIds) {
      await deleteTestProject(id);
    }

    createdProjectIds.length = 0;
  });

  it("should return project options successfully", async () => {
    const search = `TEST-OPTIONS-${Date.now()}`;

    const project = await createTestProject({
      name: search,
    });

    createdProjectIds.push(project.id);

    const response = await request(app).get("/api/projects/options");

    expect(response.status).toBe(200);

    expect(Array.isArray(response.body)).toBe(true);

    expect(response.body).toEqual(
      expect.arrayContaining([
        {
          id: project.id,
          name: project.name,
        },
      ]),
    );
  });
});
describe("PATCH /api/projects/:id", () => {
  const createdProjectIds: number[] = [];

  afterEach(async () => {
    for (const id of createdProjectIds) {
      await deleteTestProject(id);
    }

    createdProjectIds.length = 0;
  });

  it("should update a project successfully", async () => {
    const project = await createTestProject({
      name: `[TEST] Original Project ${Date.now()}`,
      description: "Original description",
      status: "Active",
      startDate: "2026-01-01",
      dueDate: "2026-12-31",
    });

    createdProjectIds.push(project.id);

    const updateData = {
      name: `[TEST] Updated Project ${Date.now()}`,
      description: "Updated description",
      status: "On Hold" as const,
      startDate: "2026-02-01",
      dueDate: "2026-11-30",
    };

    const response = await request(app)
      .patch(`/api/projects/${project.id}`)
      .send(updateData);

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      id: project.id,
      name: updateData.name,
      description: updateData.description,
      status: updateData.status,
    });

    expect(response.body.startDate).toContain(updateData.startDate);

    expect(response.body.dueDate).toContain(updateData.dueDate);
  });
  it("should update only the provided fields", async () => {
    const project = await createTestProject({
      name: `[TEST] Partial Update ${Date.now()}`,
      description: "Original description",
      status: "Active",
    });

    createdProjectIds.push(project.id);

    const response = await request(app)
      .patch(`/api/projects/${project.id}`)
      .send({
        name: "[TEST] Updated Name",
      });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      id: project.id,
      name: "[TEST] Updated Name",
      description: project.description,
      status: project.status,
    });
  });
  it("should return 404 when updating a nonexistent project", async () => {
    const response = await request(app).patch("/api/projects/999999999").send({
      name: "[TEST] Nonexistent Project",
    });

    expect(response.status).toBe(404);

    expect(response.body).toHaveProperty("message", "Project not found");
  });
  it("should return 400 for an invalid project ID", async () => {
    const response = await request(app).patch("/api/projects/invalid").send({
      name: "[TEST] Invalid ID",
    });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty("message", "Invalid project ID");
  });
  it("should reject an invalid status during update", async () => {
    const project = await createTestProject({
      name: `[TEST] Invalid Update Status ${Date.now()}`,
    });

    createdProjectIds.push(project.id);

    const response = await request(app)
      .patch(`/api/projects/${project.id}`)
      .send({
        status: "Completed",
      });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty("message", "Validation failed");

    expect(response.body.errors).toHaveProperty("status");
  });
});
describe("DELETE /api/projects/:id", () => {
  it("should delete a project successfully", async () => {
    const project = await createTestProject({
      name: `[TEST] Delete Project ${Date.now()}`,
    });

    const response = await request(app).delete(`/api/projects/${project.id}`);

    expect(response.status).toBe(204);

    const getResponse = await request(app).get(`/api/projects/${project.id}`);

    expect(getResponse.status).toBe(404);
  });
  it("should return 404 when deleting a nonexistent project", async () => {
    const response = await request(app).delete("/api/projects/999999999");

    expect(response.status).toBe(404);

    expect(response.body).toHaveProperty("message", "Project not found");
  });
  it("should return 400 for an invalid project ID", async () => {
    const response = await request(app).delete("/api/projects/invalid");

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty("message", "Invalid project ID");
  });
  it("should delete tasks when their project is deleted", async () => {
    const project = await createTestProject({
      name: `[TEST] Cascade Project ${Date.now()}`,
    });

    const task = await createTestTask({
      projectId: project.id,
      title: `[TEST] Cascade Task ${Date.now()}`,
    });

    const deleteResponse = await request(app).delete(
      `/api/projects/${project.id}`,
    );

    expect(deleteResponse.status).toBe(204);

    const taskResponse = await request(app).get(`/api/tasks/${task.id}`);

    expect(taskResponse.status).toBe(404);
  });
});
