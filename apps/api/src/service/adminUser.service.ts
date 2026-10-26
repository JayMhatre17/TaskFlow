import { or } from "@prisma/orm-postgres/orm-client";
import { randomBytes } from "node:crypto";
import { Temporal } from "@js-temporal/polyfill";
import { ApiError } from "../errors/api.error.js";
import { db } from "../prisma/db.js";
import type { AdminUserQueryInput, CreateAdminUserInput } from "../schema/auth.schema.js";
import { hashpassword } from "../utils/password.js";

const publicUserFields = [
  "id",
  "name",
  "email",
  "role",
  "status",
  "mustChangePassword",
  "createdAt",
] as const;

export const listManagedUsers = async (query: AdminUserQueryInput) => {
  const baseQuery = query.search
    ? db.orm.public.User.where((user) =>
        or(
          user.name.ilike(`%${query.search}%`),
          user.email.ilike(`%${query.search}%`),
        ),
      )
    : db.orm.public.User;

  const [count, users] = await Promise.all([
    baseQuery.aggregate((aggregate) => ({ total: aggregate.count() })),
    (query.search
      ? db.orm.public.User.select(...publicUserFields).where((user) =>
          or(
            user.name.ilike(`%${query.search}%`),
            user.email.ilike(`%${query.search}%`),
          ),
        )
      : db.orm.public.User.select(...publicUserFields))
      .orderBy((user) => user.createdAt.desc())
      .offset((query.page - 1) * query.limit)
      .limit(query.limit)
      .all(),
  ]);

  return {
    data: users,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: count.total,
      totalPages: Math.ceil(count.total / query.limit),
    },
  };
};

export const createManagedUser = async (input: CreateAdminUserInput) => {
  const email = input.email.toLowerCase();
  const existingUser = await db.orm.public.User.where({ email }).first();
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const passwordHash = await hashpassword(input.temporaryPassword);
  try {
    const user = await db.orm.public.User.create({
      name: input.name,
      email,
      passwordHash,
      role: "USER",
      status: "ACTIVE",
      isProtectedAdmin: false,
      mustChangePassword: true,
    });
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
    };
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "23505" || code === "P2002") {
      throw new ApiError(409, "An account with this email already exists");
    }
    throw error;
  }
};

const toManagedUser = (user: {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "DEACTIVATED" | "PENDING_DELETION" | "DELETED";
  mustChangePassword: boolean;
  createdAt: unknown;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  mustChangePassword: user.mustChangePassword,
  createdAt: user.createdAt,
});

export const changeManagedUserStatus = async (
  targetUserId: number,
  actorId: number,
  nextStatus: "ACTIVE" | "DEACTIVATED",
) =>
  db.transaction(async (tx) => {
    const actor = await tx.orm.public.User.where({ id: actorId }).first();
    if (
      !actor ||
      actor.status !== "ACTIVE" ||
      actor.role !== "ADMIN" ||
      !actor.isProtectedAdmin ||
      actor.mustChangePassword
    ) {
      throw new ApiError(403, "Master administrator access required");
    }
    if (targetUserId === actorId) {
      throw new ApiError(403, "You cannot change your own administrator account");
    }

    const target = await tx.orm.public.User.where({ id: targetUserId }).first();
    if (!target) throw new ApiError(404, "User not found");
    if (target.role !== "USER" || target.isProtectedAdmin) {
      throw new ApiError(403, "Only regular user accounts can be changed");
    }

    if (target.status === nextStatus) {
      if (nextStatus === "DEACTIVATED") {
        await tx.orm.public.Session.where({ userId: targetUserId }).deleteAll();
      }
      return { changed: false, user: toManagedUser(target) };
    }

    const expectedStatus = nextStatus === "DEACTIVATED" ? "ACTIVE" : "DEACTIVATED";
    if (target.status !== expectedStatus) {
      throw new ApiError(409, "Account cannot be changed from its current status");
    }

    const updated = await tx.orm.public.User.where({
      id: targetUserId,
      role: "USER",
      isProtectedAdmin: false,
      status: expectedStatus,
    }).update({
      status: nextStatus,
      deactivatedAt: nextStatus === "DEACTIVATED" ? Temporal.Now.instant().toString() : null,
    });

    if (!updated) {
      const latest = await tx.orm.public.User.where({ id: targetUserId }).first();
      if (!latest) throw new ApiError(404, "User not found");
      if (latest.role !== "USER" || latest.isProtectedAdmin) {
        throw new ApiError(403, "Only regular user accounts can be changed");
      }
      if (latest.status === nextStatus) {
        if (nextStatus === "DEACTIVATED") {
          await tx.orm.public.Session.where({ userId: targetUserId }).deleteAll();
        }
        return { changed: false, user: toManagedUser(latest) };
      }
      throw new ApiError(409, "Account status changed; refresh and try again");
    }

    if (nextStatus === "DEACTIVATED") {
      await tx.orm.public.Session.where({ userId: targetUserId }).deleteAll();
    }
    await tx.orm.public.AccountActivity.create({
      userId: targetUserId,
      actorId,
      action: nextStatus === "DEACTIVATED" ? "DEACTIVATED" : "REACTIVATED",
      oldValue: expectedStatus,
      newValue: nextStatus,
      description: nextStatus === "DEACTIVATED" ? "Account deactivated by Master Admin" : "Account reactivated by Master Admin",
    });

    return { changed: true, user: toManagedUser(updated) };
  });

export const resetManagedUserPassword = async (targetUserId: number, actorId: number) => {
  const actor = await db.orm.public.User.where({ id: actorId }).first();
  if (
    !actor ||
    actor.status !== "ACTIVE" ||
    actor.role !== "ADMIN" ||
    !actor.isProtectedAdmin ||
    actor.mustChangePassword
  ) {
    throw new ApiError(403, "Master administrator access required");
  }
  if (targetUserId === actorId) {
    throw new ApiError(403, "You cannot reset your own administrator account");
  }

  const eligibleTarget = await db.orm.public.User.where({ id: targetUserId }).first();
  if (!eligibleTarget) throw new ApiError(404, "User not found");
  if (eligibleTarget.role !== "USER" || eligibleTarget.isProtectedAdmin) {
    throw new ApiError(403, "Only regular user accounts can have their passwords reset");
  }
  if (eligibleTarget.status !== "ACTIVE") {
    throw new ApiError(409, "Only active accounts can have their passwords reset");
  }

  const temporaryPassword = randomBytes(24).toString("base64url");
  const passwordHash = await hashpassword(temporaryPassword);

  return db.transaction(async (tx) => {
    const actor = await tx.orm.public.User.where({ id: actorId }).first();
    if (
      !actor ||
      actor.status !== "ACTIVE" ||
      actor.role !== "ADMIN" ||
      !actor.isProtectedAdmin ||
      actor.mustChangePassword
    ) {
      throw new ApiError(403, "Master administrator access required");
    }
    if (targetUserId === actorId) {
      throw new ApiError(403, "You cannot reset your own administrator account");
    }

    const target = await tx.orm.public.User.where({ id: targetUserId }).first();
    if (!target) throw new ApiError(404, "User not found");
    if (target.role !== "USER" || target.isProtectedAdmin) {
      throw new ApiError(403, "Only regular user accounts can have their passwords reset");
    }
    if (target.status !== "ACTIVE") {
      throw new ApiError(409, "Only active accounts can have their passwords reset");
    }

    const updated = await tx.orm.public.User.where({
      id: targetUserId,
      role: "USER",
      isProtectedAdmin: false,
      status: "ACTIVE",
      passwordHash: target.passwordHash,
    }).update({ passwordHash, mustChangePassword: true });

    if (!updated) {
      throw new ApiError(409, "Account changed; refresh and try again");
    }

    await tx.orm.public.Session.where({ userId: targetUserId }).deleteAll();
    return { temporaryPassword, user: toManagedUser(updated) };
  });
};

export const forceManagedUserPasswordChange = async (
  targetUserId: number,
  actorId: number,
) =>
  db.transaction(async (tx) => {
    const actor = await tx.orm.public.User.where({ id: actorId }).first();
    if (
      !actor ||
      actor.status !== "ACTIVE" ||
      actor.role !== "ADMIN" ||
      !actor.isProtectedAdmin ||
      actor.mustChangePassword
    ) {
      throw new ApiError(403, "Master administrator access required");
    }
    if (targetUserId === actorId) {
      throw new ApiError(403, "You cannot change your own administrator account");
    }

    const target = await tx.orm.public.User.where({ id: targetUserId }).first();
    if (!target) throw new ApiError(404, "User not found");
    if (target.role !== "USER" || target.isProtectedAdmin) {
      throw new ApiError(403, "Only regular user accounts can be updated");
    }
    if (target.status !== "ACTIVE") {
      throw new ApiError(409, "Only active accounts can be updated");
    }

    const updated = await tx.orm.public.User.where({
      id: targetUserId,
      role: "USER",
      isProtectedAdmin: false,
      status: "ACTIVE",
      passwordHash: target.passwordHash,
    }).update({ mustChangePassword: true });

    if (!updated) {
      throw new ApiError(409, "Account changed; refresh and try again");
    }

    await tx.orm.public.Session.where({ userId: targetUserId }).deleteAll();
    return toManagedUser(updated);
  });
