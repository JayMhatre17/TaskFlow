import { apiRequest } from "./client";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  isProtectedAdmin: boolean;
  mustChangePassword: boolean;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type AuthUserResponse = {
  user: AuthUser;
};

export const login = (credentials: LoginInput) =>
  apiRequest<{ message: string } & AuthUserResponse>({
    method: "POST",
    path: "/api/auth/login",
    body: credentials,
  });

export const getCurrentUser = () =>
  apiRequest<AuthUserResponse>({
    method: "GET",
    path: "/api/auth/me",
  });

export const updateCurrentUserProfile = (input: { name: string }) =>
  apiRequest<AuthUserResponse>({
    method: "PATCH",
    path: "/api/auth/me",
    body: input,
  });

export const changePassword = (input: ChangePasswordInput) =>
  apiRequest<{ message: string }>({
    method: "PATCH",
    path: "/api/auth/password",
    body: input,
  });

export const logout = () =>
  apiRequest<void>({
    method: "POST",
    path: "/api/auth/logout",
  });
