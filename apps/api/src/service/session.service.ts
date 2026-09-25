import { randomBytes } from "node:crypto";
import { db } from "../prisma/db";

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export const createSession = async (userId: number) => {
  const sessionId = randomBytes(32).toString("hex");

  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  return db.orm.public.Session.create({
    id: sessionId,
    userId,
    expiresAt,
  });
};
