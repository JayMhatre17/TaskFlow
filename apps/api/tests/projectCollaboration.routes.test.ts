import request from "supertest";
import { Temporal } from "@js-temporal/polyfill";
import { describe, expect, it } from "vitest";
import app from "../src/app";
import { db } from "../src/prisma/db";
import { createUser } from "../src/service/auth.service";
import {
  authenticatedRequestWithSession,
  createAuthenticatedAgent,
} from "./helpers/auth.helper";

describe("project member candidate search", () => {
  it("returns only eligible public candidates to a project owner with bounded results", async () => {
    const owner = await createAuthenticatedAgent();
    const member = await createAuthenticatedAgent();
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const searchTerm = `member-search-${suffix}`;
    const candidates = [];
    const project = await db.orm.public.Project.create({
      name: `[TEST] Member search ${suffix}`,
      description: "Project member search route test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.user.id,
    });

    try {
      await db.orm.public.ProjectMember.create({
        projectId: project.id,
        userId: member.user.id,
        addedById: owner.user.id,
        removedAt: null,
      });

      const activeMemberCandidate = await createUser(
        `${searchTerm} Already Member`,
        `${searchTerm}-member@example.com`,
        "password123",
      );
      candidates.push(activeMemberCandidate.id);
      await db.orm.public.ProjectMember.create({
        projectId: project.id,
        userId: activeMemberCandidate.id,
        addedById: owner.user.id,
        removedAt: null,
      });

      const inactiveCandidate = await createUser(
        `${searchTerm} Inactive`,
        `${searchTerm}-inactive@example.com`,
        "password123",
      );
      candidates.push(inactiveCandidate.id);
      await db.orm.public.User.where({ id: inactiveCandidate.id }).update({
        status: "DEACTIVATED",
      });

      for (let index = 0; index < 12; index += 1) {
        const user = await createUser(
          `${searchTerm} Candidate ${index}`,
          `${searchTerm}-${index}@example.com`,
          "password123",
        );
        candidates.push(user.id);
      }

      const ownerRequest = authenticatedRequestWithSession(owner.session.id);
      const response = await ownerRequest.get(
        `/api/projects/${project.id}/members/search?q=${encodeURIComponent(searchTerm)}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(10);
      expect(response.body.users).toEqual(
        response.body.users.map((user: Record<string, unknown>) =>
          expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
            email: expect.any(String),
          }),
        ),
      );
      for (const user of response.body.users) {
        expect(Object.keys(user).sort()).toEqual(["email", "id", "name"]);
        expect(user.id).not.toBe(activeMemberCandidate.id);
        expect(user.id).not.toBe(inactiveCandidate.id);
      }

      const membersResponse = await ownerRequest.get(
        `/api/projects/${project.id}/members`,
      );
      expect(membersResponse.status).toBe(200);
      const listedMember = membersResponse.body.find(
        (listed: { userId: number }) => listed.userId === member.user.id,
      );
      expect(listedMember).toMatchObject({
        userId: member.user.id,
        name: member.user.name,
        email: member.user.email,
      });
      expect(Object.keys(listedMember).sort()).toEqual([
        "email",
        "joinedAt",
        "name",
        "userId",
      ]);

      const memberResponse = await authenticatedRequestWithSession(
        member.session.id,
      ).get(
        `/api/projects/${project.id}/members/search?q=${encodeURIComponent(searchTerm)}`,
      );
      expect(memberResponse.status).toBe(403);

      for (const invalidQuery of ["x", "x".repeat(101)]) {
        const invalidResponse = await ownerRequest.get(
          `/api/projects/${project.id}/members/search?q=${encodeURIComponent(invalidQuery)}`,
        );
        expect(invalidResponse.status).toBe(400);
      }

      const missingQueryResponse = await ownerRequest.get(
        `/api/projects/${project.id}/members/search`,
      );
      expect(missingQueryResponse.status).toBe(400);

      const unauthenticatedResponse = await request(app).get(
        `/api/projects/${project.id}/members/search?q=${encodeURIComponent(searchTerm)}`,
      );
      expect(unauthenticatedResponse.status).toBe(401);
    } finally {
      await db.orm.public.Project.where({ id: project.id }).delete();
      for (const candidateId of candidates) {
        await db.orm.public.User.where({ id: candidateId }).delete();
      }
      await owner.cleanup();
      await member.cleanup();
    }
  });
});
