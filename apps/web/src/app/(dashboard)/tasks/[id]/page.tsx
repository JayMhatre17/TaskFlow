import { notFound } from "next/navigation";

import { getTask } from "@/lib/api/task.api";
import { getProject } from "@/lib/api/project.api";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DeleteTaskButton from "@/components/task/DeleteTaskButton";

export default async function TaskDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const taskId = Number(id);

  if (!Number.isInteger(taskId)) {
    notFound();
  }

  const task = await getTask(taskId);

  if (!task) {
    notFound();
  }

  const project = await getProject(task.projectId);

  if (!project) {
    notFound();
  }

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

          <DeleteTaskButton taskId={task.id} />
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

              <p className="mt-1 font-medium">{project.name}</p>
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
}
