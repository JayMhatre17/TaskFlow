"use client";

import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";
import useProjectOptions from "@/hooks/queries/useProjectOptions";
import { useTask } from "@/hooks/queries/useTask";
import { ApiError } from "@/lib/api/client";
import type { TaskFormValues } from "./task.schema";
import CreateTaskForm from "./CreateTaskForm";

type EditTaskFormContentProps = {
  taskId: number;
};

const EditTaskFormContent = ({ taskId }: EditTaskFormContentProps) => {
  const taskQuery = useTask(taskId);
  const projectsQuery = useProjectOptions();

  if (
    taskQuery.isError &&
    taskQuery.error instanceof ApiError &&
    taskQuery.error.status === 404
  ) {
    return (
      <EmptyState
        iconType="tasks"
        title="Task not found"
        description="The task you're looking for does not exist."
      />
    );
  }

  if (taskQuery.isError || projectsQuery.isError) {
    const error = taskQuery.error ?? projectsQuery.error;
    const errorMessage =
      error instanceof Error ? error.message : "Please try again.";
    const refetch = () => {
      void taskQuery.refetch();
      void projectsQuery.refetch();
    };

    return (
      <ErrorState
        title="Failed to load task"
        description={errorMessage}
        onRetry={refetch}
      />
    );
  }

  if (taskQuery.isPending || projectsQuery.isPending) {
    return <LoadingState message="Loading task..." />;
  }

  const { data: task } = taskQuery;
  const { data: projects } = projectsQuery;

  const projectOptions = projects.map((project) => ({
    label: project.name,
    value: String(project.id),
  }));

  const defaultValues: TaskFormValues = {
    title: task.title,
    description: task.description ?? "",
    projectId: String(task.project?.id),
    assigneeId: task.assigneeId === null ? "" : String(task.assigneeId),
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
  };

  return (
    <CreateTaskForm
      mode="edit"
      taskId={task.id}
      defaultValues={defaultValues}
      projectOptions={projectOptions}
    />
  );
};

export default EditTaskFormContent;
