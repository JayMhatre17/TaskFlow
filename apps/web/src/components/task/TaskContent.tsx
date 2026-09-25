"use client";

import { useTasks } from "@/hooks/queries/useTasks";
import EmptyState from "../states/EmptyState";
import ErrorState from "../states/ErrorState";
import LoadingState from "../states/LoadingState";
import TaskFilters from "./TaskFilters";
import TasksTable, { SortBy } from "./TasksTable";
import { useSearchParams } from "next/navigation";

const TasksContent = () => {
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const priority = searchParams.get("priority") ?? undefined;
  const projectId = searchParams.get("projectId") ?? undefined;

  const sortBy = (searchParams.get("sortBy") as SortBy) ?? "createdAt";

  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const {
    data: tasks,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useTasks(
    page,
    limit,
    search,
    status,
    priority,
    projectId,
    sortBy,
    sortOrder,
  );

  return (
    <>
      <TaskFilters onRefresh={refetch} isRefreshing={isFetching} />

      {isPending && <LoadingState message="Loading tasks..." />}

      {isError && (
        <ErrorState
          title="Failed to load tasks"
          description={error.message}
          onRetry={() => refetch()}
        />
      )}

      {!isPending && !isError && tasks.data.length === 0 && (
        <EmptyState
          iconType="tasks"
          title="No tasks found"
          description="Try changing your search or filters."
        />
      )}

      {!isPending && !isError && tasks.data.length > 0 && (
        <TasksTable tasks={tasks.data} pagination={tasks.pagination} />
      )}
    </>
  );
};

export default TasksContent;
