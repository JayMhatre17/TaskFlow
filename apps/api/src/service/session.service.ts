import { randomBytes } from "node:crypto";
import { db } from "../prisma/db";
import { Temporal } from "@js-temporal/polyfill";

const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days in milliseconds

export const createSession = async (userId: number) => {
  const sessionId = randomBytes(32).toString("hex");

  const expiresAt = Temporal.Now.instant().add({
    seconds: SESSION_DURATION_SECONDS,
  });

  return db.orm.public.Session.create({
    id: sessionId,
    userId,
    expiresAt,
  });
};

export const getSessionById = async (sessionId: string) => {
  return db.orm.public.Session.where({ id: sessionId }).first();
};

export const isSessionExpired = (expiresAt: Temporal.Instant) => {
  return expiresAt.epochMilliseconds <= Date.now();
};
