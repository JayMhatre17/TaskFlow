import { apiRequest } from "./client";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

export type LoginInput = {
  email: string;
  password: string;
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

export const logout = () =>
  apiRequest<void>({
    method: "POST",
    path: "/api/auth/logout",
  });
