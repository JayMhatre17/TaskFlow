import { apiRequest } from "./client";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type Task = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  projectId: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  projectId: number;
};

export type UpdateTaskInput = Partial<CreateTaskInput>;

// all tasks
export const getTasks = () => {
  return apiRequest<Task[]>({
    method: "GET",
    path: "/api/tasks",
  });
};

//tasks by id
export const getTask = (id: number) => {
  return apiRequest<Task>({
    method: "GET",
    path: `/api/tasks/${id}`,
  });
};

//create task
export const createTask = (data: CreateTaskInput) => {
  return apiRequest<Task>({
    method: "POST",
    path: "/api/tasks",
    body: data,
  });
};

//update task
export const updateTask = (id: number, data: UpdateTaskInput) => {
  return apiRequest<Task>({
    method: "PATCH",
    path: `/api/tasks/${id}`,
    body: data,
  });
};

//delete task
export const deleteTask = (id: number) => {
  return apiRequest<void>({
    method: "DELETE",
    path: `/api/tasks/${id}`,
  });
};
