"use client";

import { useTasks } from "@/hooks/queries/useTasks";
import TasksTable from "./TasksTable";
import LoadingState from "../states/LoadingState";
import ErrorState from "../states/ErrorState";
import EmptyState from "../states/EmptyState";

const TasksContent = () => {
  const { data: tasks, isPending, isError, error, refetch } = useTasks();

  if (isPending) {
    return <LoadingState message="Loading tasks..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load tasks"
        description={error.message}
        onRetry={() => refetch()}
      />
    );
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        iconType="tasks"
        title="No tasks found"
        description="Create your first task to get started."
      />
    );
  }

  return <TasksTable tasks={tasks} />;
};

export default TasksContent;
