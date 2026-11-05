import { apiRequest } from "./client";
import type { DescriptionInput, RichTextDocument } from "./rich-text.types";
import type { Task } from "./task.api";

export type Project = {
  id: number;
  ownerId: number;
  owner?: {
    id: number;
    name: string;
    email: string;
  } | null;
  name: string;
  description: string | null;
  descriptionContent: RichTextDocument | null;
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

export type DeletedProject = Pick<Project, "id" | "name" | "description" | "descriptionContent"> & {
  deletedAt: string;
  scheduledDeletionAt: string | null;
};

export type DeletedProjectsResponse = { projects: DeletedProject[] };
type ProjectFieldsInput = {
  name: string;
  status: "Active" | "On Hold";
  startDate: string;
  dueDate: string;
};

export type CreateProjectInput = ProjectFieldsInput & DescriptionInput;

export type UpdateProjectInput = Partial<ProjectFieldsInput> & DescriptionInput;

export type ProjectOption = {
  id: number;
  name: string;
};

export type ProjectTaskOverview = {
  summary: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    completionPercentage: number;
  };
  recentTasks: Task[];
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

export const getDeletedProjects = () =>
  apiRequest<DeletedProjectsResponse>({
    method: "GET",
    path: "/api/projects/deleted",
  });

export const restoreProject = (id: number) =>
  apiRequest<{ message: string; project: Project }>({
    method: "POST",
    path: `/api/projects/${id}/restore`,
  });

export const getTasksByProject = (projectId: number) => {
  return apiRequest<Task[]>({
    method: "GET",
    path: `/api/projects/${projectId}/tasks`,
  });
};

export const getProjectTaskOverview = (projectId: number) =>
  apiRequest<ProjectTaskOverview>({
    method: "GET",
    path: `/api/projects/${projectId}/task-overview`,
  });

export const getProjectOptions = () => {
  return apiRequest<ProjectOption[]>({
    method: "GET",
    path: "/api/projects/options",
  });
};
