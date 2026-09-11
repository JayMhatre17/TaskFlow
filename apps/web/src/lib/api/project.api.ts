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

export type CreateProjectInput = {
  name: string;
  description?: string;
  status: "Active" | "On Hold";
  startDate: string;
  dueDate: string;
};

export type UpdateProjectInput = Partial<CreateProjectInput>;

export const getProjects = () => {
  return apiRequest<Project[]>({
    method: "GET",
    path: "/api/projects",
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
