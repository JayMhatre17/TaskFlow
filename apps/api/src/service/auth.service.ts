import { ApiError } from "../errors/api.error.js";
import { db } from "../prisma/db.js";
import { hashpassword, verifypassword } from "../utils/password.js";

export const getUserByEmail = async (email: string) => {
  return db.orm.public.User.where({
    email,
  }).first();
};

export const createUser = async (
  name: string,
  email: string,
  password: string,
) => {
  const passwordHash = await hashpassword(password);

  return db.orm.public.User.create({ name, email, passwordHash });
};

export const login = async (email: string, password: string) => {
  const user = await getUserByEmail(email);

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }
  if (user.status !== "ACTIVE") {
    throw new ApiError(401, "Invalid email or password");
  }
  const isPasswordValid = await verifypassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  return user;
};

export const updateProfile = async (userId: number, name: string) => {
  const user = await db.orm.public.User.where({ id: userId }).update({ name });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isProtectedAdmin: user.isProtectedAdmin,
    mustChangePassword: user.mustChangePassword,
  };
};

export const changePassword = async (
  userId: number,
  currentSessionId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await db.orm.public.User.where({ id: userId }).first();
  if (!user) {
    throw new ApiError(401, "Authentication required");
  }

  const currentPasswordIsValid = await verifypassword(
    currentPassword,
    user.passwordHash,
  );
  if (!currentPasswordIsValid) {
    throw new ApiError(400, "Current password is incorrect");
  }

  if (await verifypassword(newPassword, user.passwordHash)) {
    throw new ApiError(400, "New password must be different from current password");
  }

  const newPasswordHash = await hashpassword(newPassword);

  await db.transaction(async (tx) => {
    const currentSession = await tx.orm.public.Session.where({
      id: currentSessionId,
      userId,
    }).first();
    if (!currentSession) {
      throw new ApiError(401, "Invalid or expired session");
    }

    const updatedUser = await tx.orm.public.User.where({
      id: userId,
      passwordHash: user.passwordHash,
    }).update({ passwordHash: newPasswordHash, mustChangePassword: false });

    if (!updatedUser) {
      throw new ApiError(409, "Password changed by another request; try again");
    }

    const sessions = await tx.orm.public.Session.where({ userId }).all();
    for (const session of sessions) {
      if (session.id !== currentSessionId) {
        await tx.orm.public.Session.where({ id: session.id }).delete();
      }
    }
  });
};
