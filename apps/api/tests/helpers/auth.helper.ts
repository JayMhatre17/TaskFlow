import request from "supertest";
import app from "../../src/app";
import { createUser } from "../../src/service/auth.service";
import { createSession } from "../../src/service/session.service";
import { db } from "../../src/prisma/db";

export const createAuthenticatedAgent = async () => {
  const user = await createUser(
    "API Test User",
    `api-test-${Date.now()}-${Math.random()}@example.com`,
    "password123",
  );

  const session = await createSession(user.id);

  const agent = request.agent(app);

  agent.jar.setCookie(
    `taskflow_session=${session.id}; Path=/; HttpOnly`,
    "http://localhost",
  );

  return {
    agent,
    user,
    session,
    cleanup: async () => {
      await db.orm.public.Session.where({ id: session.id }).delete();

      await db.orm.public.Project.where({
        ownerId: user.id,
      }).delete();

      await db.orm.public.User.where({ id: user.id }).delete();
    },
  };
};

let sessionId: string | undefined;

export const setupTestAuth = async (): Promise<string> => {
  const user = await createUser(
    "Test User",
    `test-${Date.now()}@example.com`,
    "password123",
  );

  const session = await createSession(user.id);
  sessionId = session.id;
  return sessionId;
};

export const authenticatedRequest = () => {
  if (!sessionId) {
    throw new Error("Test authentication has not been initialized");
  }

  const cookie = `taskflow_session=${sessionId}`;

  return {
    get: (url: string) => request(app).get(url).set("Cookie", cookie),
    post: (url: string) => request(app).post(url).set("Cookie", cookie),
    patch: (url: string) => request(app).patch(url).set("Cookie", cookie),
    delete: (url: string) => request(app).delete(url).set("Cookie", cookie),
  };
};

export const authenticatedRequestWithSession = (sessionId: string) => {
  const cookie = `taskflow_session=${sessionId}`;

  return {
    get: (url: string) => request(app).get(url).set("Cookie", cookie),
    post: (url: string) => request(app).post(url).set("Cookie", cookie),
    patch: (url: string) => request(app).patch(url).set("Cookie", cookie),
    delete: (url: string) => request(app).delete(url).set("Cookie", cookie),
  };
};
