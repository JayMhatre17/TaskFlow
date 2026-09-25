"use client";

import { useSearchParams } from "next/navigation";

import { useProjects } from "@/hooks/queries/useProjects";

import ProjectsTable from "./ProjectsTable";
import ProjectFilters from "./ProjectFilters";
import { ProjectQueryParams } from "@/lib/api/project.api";

const ProjectsContent = () => {
  const searchParams = useSearchParams();

  const pageParam = Number(searchParams.get("page"));
  const limitParam = Number(searchParams.get("limit"));

  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const limit =
    Number.isInteger(limitParam) && limitParam > 0 ? limitParam : 10;

  const search = searchParams.get("search") || undefined;

  const statusParam = searchParams.get("status");

  const status: ProjectQueryParams["status"] =
    statusParam === "Active" || statusParam === "On Hold"
      ? statusParam
      : undefined;

  const sortByParam = searchParams.get("sortBy");

  const sortBy =
    sortByParam === "name" ||
    sortByParam === "status" ||
    sortByParam === "startDate" ||
    sortByParam === "dueDate" ||
    sortByParam === "createdAt" ||
    sortByParam === "updatedAt"
      ? sortByParam
      : undefined;

  const sortOrderParam = searchParams.get("sortOrder");

  const sortOrder =
    sortOrderParam === "asc" || sortOrderParam === "desc"
      ? sortOrderParam
      : undefined;

  const queryParams: ProjectQueryParams = {
    page,
    limit,
    search,
    status,
    sortBy,
    sortOrder,
  };

  const {
    data: projectsResponse,
    isPending,
    isError,
    error,
    refetch,
    isRefetching,
  } = useProjects(queryParams);

  return (
    <>
      <ProjectFilters onRefetch={refetch} isRefetching={isRefetching} />

      <ProjectsTable
        projects={projectsResponse?.data ?? []}
        pagination={projectsResponse?.pagination}
        isPending={isPending}
        isError={isError}
        error={error}
        onRetry={refetch}
      />
    </>
  );
};

export default ProjectsContent;
