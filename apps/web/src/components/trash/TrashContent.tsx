"use client";

import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useDeletedProjects, useDeletedTasks } from "@/hooks/queries/useDeletedItems";
import { useRestoreProject, useRestoreTask } from "@/hooks/mutation/useRestoreDeletedItems";
import LoadingState from "@/components/states/LoadingState";
import ErrorState from "@/components/states/ErrorState";
import { Button } from "@/components/ui/button";
import type { DeletedProject } from "@/lib/api/project.api";
import type { DeletedTask } from "@/lib/api/task.api";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));

export default function TrashContent() {
  const projectsQuery = useDeletedProjects();
  const tasksQuery = useDeletedTasks();
  const restoreProject = useRestoreProject();
  const restoreTask = useRestoreTask();
  const [pendingProjectId, setPendingProjectId] = useState<number | null>(null);
  const [pendingTaskId, setPendingTaskId] = useState<number | null>(null);

  const restoreProjectClick = async (project: DeletedProject) => {
    setPendingProjectId(project.id);
    try {
      await restoreProject.mutateAsync(project.id);
      toast.success(`“${project.name}” restored`);
    } catch {
      toast.error("Could not restore this project. Please try again.");
    } finally {
      setPendingProjectId(null);
    }
  };

  const restoreTaskClick = async (task: DeletedTask) => {
    setPendingTaskId(task.id);
    try {
      await restoreTask.mutateAsync(task.id);
      toast.success(`“${task.title}” restored`);
    } catch {
      toast.error("Could not restore this task. Please try again.");
    } finally {
      setPendingTaskId(null);
    }
  };

  if (projectsQuery.isPending || tasksQuery.isPending) {
    return <LoadingState message="Loading deleted items..." />;
  }
  if (projectsQuery.isError || tasksQuery.isError) {
    return (
      <ErrorState
        title="Couldn't load deleted items"
        description="Please try again."
        onRetry={() => {
          void projectsQuery.refetch();
          void tasksQuery.refetch();
        }}
      />
    );
  }

  const projects = projectsQuery.data.projects;
  const tasks = tasksQuery.data.tasks;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold text-gray-900">Deleted projects</h2>
          <p className="mt-1 text-sm text-gray-500">Restore a project to make it and its active tasks available again.</p>
        </div>
        {projects.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">No deleted projects.</p>
        ) : (
          <ul className="divide-y">
            {projects.map((project) => (
              <li key={project.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900" title={project.name}>{project.name}</p>
                  {project.description && <p className="mt-1 truncate text-sm text-gray-500" title={project.description}>{project.description}</p>}
                  <p className="mt-1 text-xs text-gray-500">Deleted {formatDate(project.deletedAt)}</p>
                </div>
                <Button disabled={pendingProjectId === project.id} onClick={() => void restoreProjectClick(project)}>
                  {pendingProjectId === project.id ? <Loader2 className="animate-spin" /> : <RotateCcw />}
                  {pendingProjectId === project.id ? "Restoring..." : "Restore"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold text-gray-900">Deleted tasks</h2>
          <p className="mt-1 text-sm text-gray-500">Tasks in deleted projects can be restored after restoring their project.</p>
        </div>
        {tasks.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">No deleted tasks.</p>
        ) : (
          <ul className="divide-y">
            {tasks.map((task) => {
              const parentDeleted = task.project.deletedAt !== null;
              return (
                <li key={task.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900" title={task.title}>{task.title}</p>
                    <p className="mt-1 break-words text-sm text-gray-500 [overflow-wrap:anywhere]">{task.project.name} · Deleted {formatDate(task.deletedAt)}</p>
                    {parentDeleted && <p className="mt-1 text-xs text-amber-700">Restore the project before restoring this task.</p>}
                  </div>
                  <Button disabled={parentDeleted || pendingTaskId === task.id} onClick={() => void restoreTaskClick(task)}>
                    {pendingTaskId === task.id ? <Loader2 className="animate-spin" /> : <RotateCcw />}
                    {pendingTaskId === task.id ? "Restoring..." : "Restore"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
