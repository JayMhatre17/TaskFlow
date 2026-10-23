import { apiRequest } from "./client";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TaskAssigneeSummary = {
  id: number;
  name: string;
  email: string;
};

export type TaskUserIdentity = {
  id: number;
  name: string;
  email: string;
};

export type Task = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  projectId: number;
  assigneeId: number | null;
  assignee: TaskAssigneeSummary | null;

  project?: {
    id: number;
    name: string;
  } | null;

  createdAt: string;
  updatedAt: string;
};

export type DeletedTask = Pick<
  Task,
  "id" | "title" | "description" | "status" | "priority" | "dueDate"
> & {
  deletedAt: string;
  project: {
    id: number;
    name: string;
    deletedAt: string | null;
  };
};

export type DeletedTasksResponse = { tasks: DeletedTask[] };

export type CreateTaskInput = {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  projectId: number;
};

export type TaskListResponse = {
  data: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type TaskComment = {
  id: number;
  taskId: number;
  authorId: number | null;
  author: TaskUserIdentity | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type TaskCommentsResponse = {
  comments: TaskComment[];
};

export type CreateTaskCommentResponse = {
  comment: TaskComment;
};

export type TaskActivityAction =
  | "CREATED"
  | "UPDATED"
  | "STATUS_CHANGED"
  | "PRIORITY_CHANGED"
  | "DUE_DATE_CHANGED"
  | "DELETED"
  | "RESTORED"
  | "CLOSED"
  | "REOPENED"
  | "COMMENT_ADDED"
  | "COMMENT_UPDATED"
  | "COMMENT_DELETED";

export type TaskActivity = {
  id: number;
  taskId: number;
  actorId: number | null;
  actor: TaskUserIdentity | null;
  action: TaskActivityAction;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  description: string | null;
  createdAt: string;
};

export type TaskActivitiesResponse = {
  activities: TaskActivity[];
};
export type UpdateTaskInput = Partial<CreateTaskInput>;

export type AssignTaskInput = {
  assigneeId: number | null;
  reason?: string;
};

export type AssignTaskResponse = {
  task: {
    id: number;
    projectId: number;
    assigneeId: number | null;
    assignee: TaskAssigneeSummary | null;
  } | null;
};

// all tasks
export const getTasks = (
  page: number,
  limit: number,
  search?: string,
  status?: string,
  priority?: string,
  projectId?: string,
  sortBy?: string,
  sortOrder?: string,
) => {
  return apiRequest<TaskListResponse>({
    method: "GET",
    path: "/api/tasks",
    params: {
      page,
      limit,
      search,
      status,
      priority,
      projectId,
      sortBy,
      sortOrder,
    },
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

export const assignTask = (taskId: number, data: AssignTaskInput) =>
  apiRequest<AssignTaskResponse>({
    method: "PATCH",
    path: `/api/tasks/${taskId}/assignment`,
    body: data,
  });

export const getTaskComments = (taskId: number) =>
  apiRequest<TaskCommentsResponse>({
    method: "GET",
    path: `/api/tasks/${taskId}/comments`,
  });

export const createTaskComment = (taskId: number, content: string) =>
  apiRequest<CreateTaskCommentResponse>({
    method: "POST",
    path: `/api/tasks/${taskId}/comments`,
    body: { content },
  });

export const getTaskActivities = (taskId: number) =>
  apiRequest<TaskActivitiesResponse>({
    method: "GET",
    path: `/api/tasks/${taskId}/activities`,
  });

//delete task
export const deleteTask = (id: number) => {
  return apiRequest<void>({
    method: "DELETE",
    path: `/api/tasks/${id}`,
  });
};

export const getDeletedTasks = () =>
  apiRequest<DeletedTasksResponse>({
    method: "GET",
    path: "/api/tasks/deleted",
  });

export const restoreTask = (id: number) =>
  apiRequest<{ message: string }>({
    method: "PATCH",
    path: `/api/tasks/${id}/restore`,
  });
