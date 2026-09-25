import { apiRequest } from "./client";
import { Task } from "./task.api";

export type Project = {
  id: number;
  name: string;
  description: string | null;
  status: "Active" | "On Hold";
  startDate: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
};
export type ProjectSortField =
  "name" | "status" | "startDate" | "dueDate" | "createdAt" | "updatedAt";

export type ProjectQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: Project["status"];
  sortBy?: ProjectSortField;
  sortOrder?: "asc" | "desc";
};

export type ProjectListResponse = {
  data: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
export type CreateProjectInput = {
  name: string;
  description?: string;
  status: "Active" | "On Hold";
  startDate: string;
  dueDate: string;
};

export type UpdateProjectInput = Partial<CreateProjectInput>;

export type ProjectOption = {
  id: number;
  name: string;
};

export const getProjects = (params?: ProjectQueryParams) => {
  return apiRequest<ProjectListResponse>({
    method: "GET",
    path: "/api/projects",
    params,
  });
};

export const getProject = (id: number) => {
  return apiRequest<Project>({
    method: "GET",
    path: `/api/projects/${id}`,
  });
};

export const createProject = (data: CreateProjectInput) => {
  return apiRequest<Project>({
    method: "POST",
    path: "/api/projects",
    body: data,
  });
};

export const updateProject = (id: number, data: UpdateProjectInput) => {
  return apiRequest<Project>({
    method: "PATCH",
    path: `/api/projects/${id}`,
    body: data,
  });
};

export const deleteProject = (id: number) => {
  return apiRequest<void>({
    method: "DELETE",
    path: `/api/projects/${id}`,
  });
};

export const getTasksByProject = (projectId: number) => {
  return apiRequest<Task[]>({
    method: "GET",
    path: `/api/projects/${projectId}/tasks`,
  });
};

export const getProjectOptions = () => {
  return apiRequest<ProjectOption[]>({
    method: "GET",
    path: "/api/projects/options",
  });
};
