"use client";

import { useTask } from "@/hooks/queries/useTask";
import LoadingState from "../states/LoadingState";
import ErrorState from "../states/ErrorState";
import EmptyState from "../states/EmptyState";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { Button } from "../ui/button";
import DeleteTaskAction from "./DeleteTaskAction";
import TaskActivitySection from "./TaskActivitySection";
import TaskCommentsSection from "./TaskCommentsSection";
import { formatUserName, getDistinctUserEmail } from "@/lib/user-display";
import RichTextRenderer from "@/components/rich-text/RichTextRenderer";
import { ArrowUpRight } from "lucide-react";

type TaskDetailsContentProps = {
  taskId: number;
};

const taskStatusClass = {
  TODO: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-primary/10 text-primary",
  IN_REVIEW: "bg-warning/15 text-warning",
  COMPLETED: "bg-success/15 text-success",
} as const;

const TaskDetailsContent = ({ taskId }: TaskDetailsContentProps) => {
  const { data: task, isPending, isError, error, refetch } = useTask(taskId);

  if (isPending) {
    return <LoadingState message="Loading task..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load task"
        description={error.message}
        onRetry={() => refetch()}
      />
    );
  }

  if (!task) {
    return (
      <EmptyState
        iconType="tasks"
        title="Task not found"
        description="The task you're looking for does not exist."
      />
    );
  }
  return (
    <div className="min-w-0 space-y-6">
      {/* Header */}
      <div className="flex min-w-0 flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="min-w-0 break-words text-2xl font-bold [overflow-wrap:anywhere]">{task.title}</h1>

            <Badge className={taskStatusClass[task.status]}>{task.status}</Badge>
          </div>

          {task.descriptionContent ? (
            <div className="mt-2 min-w-0 text-foreground">
              <RichTextRenderer content={task.descriptionContent} label="Task description" />
            </div>
          ) : task.description ? (
            <p className="mt-2 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
              {task.description}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href={`/tasks/${task.id}/edit`} className="cursor-pointer">
            <Button variant="outline" className="cursor-pointer">
              Edit
            </Button>
          </Link>

          <DeleteTaskAction taskId={task.id} taskTitle={task.title} />
        </div>
      </div>

      {/* Task information */}
      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <div className="min-w-0 rounded-xl border bg-card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Task Information</h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {/* Project */}
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Project</p>

              {task.project ? (
                <Link
                  href={`/projects/${task.project.id}`}
                  className="mt-1 inline-flex max-w-full items-center gap-1 break-words font-medium text-primary hover:underline [overflow-wrap:anywhere]"
                  aria-label={`Open project ${task.project.name}`}
                >
                  <span className="min-w-0 break-words">{task.project.name}</span>
                  <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
                </Link>
              ) : (
                <p className="mt-1 break-words font-medium [overflow-wrap:anywhere]">
                  Unknown project
                </p>
              )}
            </div>

            {/* Assignee */}
            <div>
              <p className="text-sm text-muted-foreground">Assignee</p>
              <p className="mt-1 font-medium">
                {task.assigneeId === null
                  ? "Unassigned"
                  : formatUserName(task.assignee)}
              </p>
              {task.assigneeId !== null &&
                getDistinctUserEmail(
                  task.assignee?.email,
                  formatUserName(task.assignee),
                ) && (
                  <p className="break-all text-sm text-muted-foreground">
                    {task.assignee?.email}
                  </p>
                )}
            </div>

            {/* Priority */}
            <div>
              <p className="text-sm text-muted-foreground">Priority</p>

              <div className="mt-1">
                <Badge variant="outline">{task.priority}</Badge>
              </div>
            </div>

            {/* Status */}
            <div>
              <p className="text-sm text-muted-foreground">Status</p>

              <div className="mt-1">
                <Badge className={taskStatusClass[task.status]}>{task.status}</Badge>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>

              <p className="mt-1 font-medium">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "No due date"}
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="min-w-0 rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Summary</h2>

          <div className="mt-6 space-y-5">
            {/* Status */}
            <div>
              <p className="text-sm text-muted-foreground">Status</p>

              <div className="mt-1">
                <Badge>{task.status}</Badge>
              </div>
            </div>

            {/* Priority */}
            <div>
              <p className="text-sm text-muted-foreground">Priority</p>

              <div className="mt-1">
                <Badge variant="outline">{task.priority}</Badge>
              </div>
            </div>

            {/* Created */}
            <div>
              <p className="text-sm text-muted-foreground">Created</p>

              <p className="mt-1 font-medium">
                {new Date(task.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* Updated */}
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>

              <p className="mt-1 font-medium">
                {new Date(task.updatedAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <TaskCommentsSection taskId={taskId} />
      <TaskActivitySection taskId={taskId} />
    </div>
  );
};

export default TaskDetailsContent;
