import { describe, expect, it } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import request from "supertest";
import app from "../src/app";
import { db } from "../src/prisma/db";
import { createSession } from "../src/service/session.service";
import { hashpassword } from "../src/utils/password";
import {
  authenticatedRequestWithSession,
  createAuthenticatedAgent,
} from "./helpers/auth.helper";

const expectInvitationResponseToBePublic = (
  invitation: Record<string, unknown>,
) => {
  expect(invitation).not.toHaveProperty("tokenHash");
  expect(invitation).not.toHaveProperty("senderId");
  expect(invitation).not.toHaveProperty("recipientId");
  expect(invitation).not.toHaveProperty("updatedAt");
};

describe("project invitation response contracts", () => {
  it("omits token hashes from invitation responses and returns the owner share token", async () => {
    const fixtures: {
      user: { id: number; email: string };
      sessionId?: string;
    }[] = [];
    let projectId: number | undefined;

    try {
      const fixturePasswordHash = await hashpassword("invitation-fixture");
      const createAuthenticatedFixture = async (label: string) => {
        const user = await db.orm.public.User.create({
          name: `Invitation ${label}`,
          email: `invitation-${label}-${Date.now()}-${Math.random()}@example.com`,
          passwordHash: fixturePasswordHash,
        });
        const fixture: (typeof fixtures)[number] = { user };
        fixtures.push(fixture);
        const session = await createSession(user.id);
        fixture.sessionId = session.id;
        return { user, session };
      };

      const owner = await createAuthenticatedFixture("owner");
      const recipient = await createAuthenticatedFixture("recipient");
      const rejectedRecipient = await createAuthenticatedFixture("rejected");
      const projectMember = await createAuthenticatedFixture("member");
      const project = await db.orm.public.Project.create({
        name: `[TEST] Invitation response ${Date.now()}`,
        description: "Invitation response contract test",
        status: "Active",
        startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
        dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
        ownerId: owner.user.id,
      });
      projectId = project.id;

      await db.orm.public.ProjectMember.create({
        projectId: project.id,
        userId: projectMember.user.id,
        addedById: owner.user.id,
        removedAt: null,
      });

      const ownerRequest = authenticatedRequestWithSession(owner.session.id);
      const createResponse = await ownerRequest
        .post(`/api/projects/${project.id}/invitations`)
        .send({ email: recipient.user.email });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.token).toEqual(expect.any(String));
      expect(createResponse.body.token.length).toBeGreaterThan(0);
      expect(createResponse.body.invitation).toMatchObject({
        projectId: project.id,
        email: recipient.user.email,
        status: "PENDING",
      });
      expectInvitationResponseToBePublic(createResponse.body.invitation);

      const rejectedCreateResponse = await ownerRequest
        .post(`/api/projects/${project.id}/invitations`)
        .send({ email: rejectedRecipient.user.email });
      expect(rejectedCreateResponse.status).toBe(201);

      const outgoingResponse = await ownerRequest.get(
        `/api/projects/${project.id}/invitations`,
      );
      expect(outgoingResponse.status).toBe(200);
      expect(outgoingResponse.body.invitations).toHaveLength(2);
      expect(outgoingResponse.body.invitations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: createResponse.body.invitation.id }),
          expect.objectContaining({
            id: rejectedCreateResponse.body.invitation.id,
          }),
        ]),
      );
      for (const invitation of outgoingResponse.body.invitations) {
        expectInvitationResponseToBePublic(invitation);
      }

      const memberRequest = authenticatedRequestWithSession(
        projectMember.session.id,
      );
      const forbiddenListResponse = await memberRequest.get(
        `/api/projects/${project.id}/invitations`,
      );
      expect(forbiddenListResponse.status).toBe(403);

      const forbiddenCancelResponse = await memberRequest.post(
        `/api/projects/${project.id}/invitations/${createResponse.body.invitation.id}/cancel`,
      );
      expect(forbiddenCancelResponse.status).toBe(403);

      const receivedInvitations = await authenticatedRequestWithSession(
        recipient.session.id,
      ).get("/api/projects/invitations");

      expect(receivedInvitations.status).toBe(200);
      expect(receivedInvitations.body.invitations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: createResponse.body.invitation.id,
            projectId: project.id,
            status: "PENDING",
          }),
        ]),
      );
      for (const invitation of receivedInvitations.body.invitations) {
        expectInvitationResponseToBePublic(invitation);
      }

      const rejectResponse = await authenticatedRequestWithSession(
        rejectedRecipient.session.id,
      )
        .post(
          `/api/projects/invitations/${rejectedCreateResponse.body.token}/action`,
        )
        .send({ action: "REJECT" });
      expect(rejectResponse.status).toBe(200);
      expectInvitationResponseToBePublic(rejectResponse.body.invitation);

      const cancelResponse = await ownerRequest.post(
        `/api/projects/${project.id}/invitations/${createResponse.body.invitation.id}/cancel`,
      );
      expect(cancelResponse.status).toBe(200);
      expectInvitationResponseToBePublic(cancelResponse.body.invitation);

      const remainingOutgoingResponse = await ownerRequest.get(
        `/api/projects/${project.id}/invitations`,
      );
      expect(remainingOutgoingResponse.status).toBe(200);
      expect(remainingOutgoingResponse.body.invitations).toEqual([]);
    } finally {
      if (projectId !== undefined) {
        await db.orm.public.Project.where({ id: projectId }).delete();
      }
      for (const fixture of fixtures) {
        if (fixture.sessionId) {
          await db.orm.public.Session.where({ id: fixture.sessionId }).delete();
        }
        await db.orm.public.User.where({ id: fixture.user.id }).delete();
      }
    }
  });

  it("accepts an invitation through the authenticated action endpoint", async () => {
    const owner = await createAuthenticatedAgent();
    const recipient = await createAuthenticatedAgent();
    const project = await db.orm.public.Project.create({
      name: `[TEST] Invitation acceptance ${Date.now()}`,
      description: "Invitation acceptance route test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.user.id,
    });

    try {
      const createResponse = await authenticatedRequestWithSession(
        owner.session.id,
      )
        .post(`/api/projects/${project.id}/invitations`)
        .send({ email: recipient.user.email });

      expect(createResponse.status).toBe(201);

      const acceptResponse = await authenticatedRequestWithSession(
        recipient.session.id,
      )
        .post(
          `/api/projects/invitations/${createResponse.body.token}/action`,
        )
        .send({ action: "ACCEPT" });

      expect(acceptResponse.status).toBe(200);
      expect(acceptResponse.body).toMatchObject({
        message: "Project invitation accepted successfully",
        invitation: {
          projectId: project.id,
          userId: recipient.user.id,
          removedAt: null,
        },
      });
      expect(acceptResponse.body.invitation).not.toHaveProperty("tokenHash");

      const membership = await db.orm.public.ProjectMember.where({
        projectId: project.id,
        userId: recipient.user.id,
        removedAt: null,
      }).first();
      expect(membership).toBeTruthy();

      const repeatedAcceptResponse = await authenticatedRequestWithSession(
        recipient.session.id,
      )
        .post(
          `/api/projects/invitations/${createResponse.body.token}/action`,
        )
        .send({ action: "ACCEPT" });
      expect(repeatedAcceptResponse.status).toBe(409);
    } finally {
      await db.orm.public.Project.where({ id: project.id }).delete();
      await owner.cleanup();
      await recipient.cleanup();
    }
  });

  it("rejects invitation actions without an authenticated session", async () => {
    const owner = await createAuthenticatedAgent();
    const recipient = await createAuthenticatedAgent();
    const project = await db.orm.public.Project.create({
      name: `[TEST] Invitation authentication ${Date.now()}`,
      description: "Invitation authentication route test",
      status: "Active",
      startDate: Temporal.Instant.from("2026-01-01T00:00:00Z"),
      dueDate: Temporal.Instant.from("2026-12-31T00:00:00Z"),
      ownerId: owner.user.id,
    });

    try {
      const createResponse = await authenticatedRequestWithSession(
        owner.session.id,
      )
        .post(`/api/projects/${project.id}/invitations`)
        .send({ email: recipient.user.email });

      expect(createResponse.status).toBe(201);

      const response = await request(app)
        .post(`/api/projects/invitations/${createResponse.body.token}/action`)
        .send({ action: "ACCEPT" });

      expect(response.status).toBe(401);

      const invitation = await db.orm.public.ProjectInvitation.where({
        id: createResponse.body.invitation.id,
      }).first();
      expect(invitation?.status).toBe("PENDING");
    } finally {
      await db.orm.public.Project.where({ id: project.id }).delete();
      await owner.cleanup();
      await recipient.cleanup();
    }
  });
});
