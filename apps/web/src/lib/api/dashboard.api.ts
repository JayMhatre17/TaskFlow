import { apiRequest } from "./client";
import type { Project } from "./project.api";
import type { Task, TaskActivityAction } from "./task.api";

export type DashboardActor = { id: number; name: string };

export type DashboardActivity = {
  id: string;
  action: TaskActivityAction | "PROJECT_CREATED" | "PROJECT_UPDATED" | "PROJECT_DELETED" | "PROJECT_RESTORED" | "OWNER_CHANGED";
  description: string | null;
  createdAt: string;
  actor: DashboardActor | null;
  project: { id: number; name: string };
  task: { id: number; title: string } | null;
};

export type DashboardSummary = {
  stats: {
    activeProjects: number;
    openTasks: number;
    completedTasks: number;
    overdueTasks: number;
  };
  taskStatusCounts: {
    todo: number;
    inProgress: number;
    inReview: number;
    completed: number;
  };
  recentProjects: Project[];
  recentTasks: Task[];
  recentActivity: DashboardActivity[];
};

export const getDashboardSummary = () =>
  apiRequest<DashboardSummary>({
    method: "GET",
    path: "/api/dashboard/summary",
  });
