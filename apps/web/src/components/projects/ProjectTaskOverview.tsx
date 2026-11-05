"use client";

import { CalendarDays, CircleAlert, ListTodo } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProjectTaskOverview as ProjectTaskOverviewData } from "@/lib/api/project.api";
import { formatDate } from "@/lib/basicFn";
import { formatUserName } from "@/lib/user-display";
import type { TaskStatus } from "@/lib/api/task.api";

type ProjectTaskOverviewProps = {
  projectId: number;
  data?: ProjectTaskOverviewData;
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
};

const taskStatusClass: Record<TaskStatus, string> = {
  TODO: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-primary/10 text-primary",
  IN_REVIEW: "bg-warning/15 text-warning",
  COMPLETED: "bg-success/15 text-success",
};

const formatStatus = (status: TaskStatus) =>
  status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const ProjectTaskOverview = ({
  projectId,
  data,
  isPending,
  error,
  onRetry,
}: ProjectTaskOverviewProps) => {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="min-w-0 space-y-6 rounded-xl border bg-card p-5 sm:p-6">
      <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">Task Overview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Progress and the latest work in this project.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href={`/tasks?projectId=${projectId}`}>
            <Button type="button" variant="outline" size="sm">
              View all tasks
            </Button>
          </Link>
          <Link href={`/tasks/new?projectId=${projectId}`}>
            <Button type="button" size="sm">
              <ListTodo aria-hidden="true" />
              Create task
            </Button>
          </Link>
        </div>
      </div>

      {isPending ? (
        <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground" role="status">
          Loading project tasks...
        </p>
      ) : error ? (
        <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground" role="alert">
            Could not load project tasks: {error.message}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryMetric label="Total tasks" value={data.summary.totalTasks} />
            <SummaryMetric label="Completed" value={data.summary.completedTasks} />
            <SummaryMetric label="In progress" value={data.summary.inProgressTasks} />
            <SummaryMetric
              label="Overdue"
              value={data.summary.overdueTasks}
              warning={data.summary.overdueTasks > 0}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Completion</span>
              <span className="font-semibold tabular-nums text-foreground">
                {data.summary.completionPercentage}%
              </span>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label="Project task completion"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={data.summary.completionPercentage}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${data.summary.completionPercentage}%` }}
              />
            </div>
          </div>

          <div className="min-w-0 border-t pt-5">
            <h3 className="text-base font-semibold text-foreground">Recent Tasks</h3>
            {data.recentTasks.length === 0 ? (
              <div className="mt-3 rounded-lg border border-dashed px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No tasks in this project yet.
                </p>
                <Link
                  href={`/tasks/new?projectId=${projectId}`}
                  className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
                >
                  Create the first task
                </Link>
              </div>
            ) : (
              <ul className="mt-3 space-y-3">
                {data.recentTasks.map((task) => {
                  const dueDate = task.dueDate?.slice(0, 10) ?? null;
                  const isOverdue =
                    task.status !== "COMPLETED" && dueDate !== null && dueDate < today;

                  return (
                    <li
                      key={task.id}
                      className="min-w-0 rounded-lg border p-3 transition-colors hover:bg-muted/30 sm:p-4"
                    >
                      <div className="flex min-w-0 flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="min-w-0 break-words font-medium text-foreground hover:text-primary hover:underline [overflow-wrap:anywhere]"
                        >
                          {task.title}
                        </Link>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <Badge className={taskStatusClass[task.status]}>
                            {formatStatus(task.status)}
                          </Badge>
                          {isOverdue && (
                            <Badge variant="destructive">
                              <CircleAlert aria-hidden="true" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                        <span className="min-w-0 break-words">
                          Assignee: {task.assigneeId === null
                            ? "Unassigned"
                            : task.assignee
                              ? formatUserName(task.assignee)
                              : "Unavailable"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                          {dueDate ? formatDate(dueDate) : "No due date"}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
};

const SummaryMetric = ({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: number;
  warning?: boolean;
}) => (
  <div className="min-w-0 rounded-lg border bg-background p-3 sm:p-4">
    <p className={`text-2xl font-semibold tabular-nums ${warning ? "text-destructive" : "text-foreground"}`}>
      {value}
    </p>
    <p className="mt-1 truncate text-xs text-muted-foreground sm:text-sm">{label}</p>
  </div>
);

export default ProjectTaskOverview;
