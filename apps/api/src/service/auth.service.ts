import { ApiError } from "../errors/api.error";
import { db } from "../prisma/db";
import { hashpassword, verifypassword } from "../utils/password";

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
  const isPasswordValid = await verifypassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  return user;
};
