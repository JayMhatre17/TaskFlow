import { apiRequest } from "./client";

export type ManagedUser = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "DEACTIVATED" | "PENDING_DELETION" | "DELETED";
  mustChangePassword: boolean;
  createdAt: string;
};

export type ManagedUsersParams = { page?: number; limit?: number; search?: string };
export type ManagedUsersResponse = {
  data: ManagedUser[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};
export type CreateManagedUserInput = { name: string; email: string; temporaryPassword: string };
export type ManagedUserStatusResponse = { message: string; user: ManagedUser };

export const getManagedUsers = (params: ManagedUsersParams) =>
  apiRequest<ManagedUsersResponse>({ method: "GET", path: "/api/admin/users", params });

export const createManagedUser = (input: CreateManagedUserInput) =>
  apiRequest<{ message: string; user: ManagedUser }>({
    method: "POST",
    path: "/api/admin/users",
    body: input,
  });

export const deactivateManagedUser = (userId: number) =>
  apiRequest<ManagedUserStatusResponse>({
    method: "PATCH",
    path: `/api/admin/users/${userId}/deactivate`,
  });

export const reactivateManagedUser = (userId: number) =>
  apiRequest<ManagedUserStatusResponse>({
    method: "PATCH",
    path: `/api/admin/users/${userId}/reactivate`,
  });
