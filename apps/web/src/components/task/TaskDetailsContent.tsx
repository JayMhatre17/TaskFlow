"use client";

import { useTask } from "@/hooks/queries/useTask";
import LoadingState from "../states/LoadingState";
import ErrorState from "../states/ErrorState";
import EmptyState from "../states/EmptyState";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { Button } from "../ui/button";
import DeleteTaskAction from "./DeleteTaskAction";

type TaskDetailsContentProps = {
  taskId: number;
};

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
  console.log(task);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{task.title}</h1>

            <Badge>{task.status}</Badge>
          </div>

          {task.description && (
            <p className="mt-2 text-sm text-muted-foreground">
              {task.description}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Link href={`/tasks/${task.id}/edit`} className="cursor-pointer">
            <Button variant="outline" className="cursor-pointer">
              Edit
            </Button>
          </Link>

          <DeleteTaskAction taskId={task.id} taskTitle={task.title} />
        </div>
      </div>

      {/* Task information */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Task Information</h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {/* Project */}
            <div>
              <p className="text-sm text-muted-foreground">Project</p>

              <p className="mt-1 font-medium">
                {task.project?.name ?? "Unknown project"}
              </p>
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
                <Badge>{task.status}</Badge>
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
        <div className="rounded-xl border bg-white p-6">
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

      {/* Activity */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Activity</h2>

        <div className="mt-6">
          <p className="text-sm text-muted-foreground">
            Activity tracking will be available once the activity system is
            implemented.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsContent;
