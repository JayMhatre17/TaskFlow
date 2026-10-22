"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import DataTable, {
  type DataTableFeatures,
} from "@/components/common/DataTable";
import { formatDate } from "@/lib/basicFn";
import type {
  Project,
  ProjectListResponse,
  ProjectSortField,
} from "@/lib/api/project.api";

import EmptyState from "../states/EmptyState";
import ErrorState from "../states/ErrorState";
import LoadingState from "../states/LoadingState";
import TasksPagination from "../task/TasksPagination";

type ProjectsTableProps = {
  projects: Project[];
  pagination?: ProjectListResponse["pagination"];
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
};

type SortOrder = "asc" | "desc";

type SortableHeaderProps = {
  title: string;
  sortKey: ProjectSortField;
  currentSortBy: string | null;
  currentSortOrder: string | null;
  onSort: (sortBy: ProjectSortField) => void;
};

const SortableHeader = ({
  title,
  sortKey,
  currentSortBy,
  currentSortOrder,
  onSort,
}: SortableHeaderProps) => {
  const isActive = currentSortBy === sortKey;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-2 font-medium"
    >
      <span>{title}</span>

      {!isActive && <ChevronsUpDown size={16} />}

      {isActive && currentSortOrder === "asc" && <ArrowUp size={16} />}

      {isActive && currentSortOrder === "desc" && <ArrowDown size={16} />}
    </button>
  );
};

const ProjectsTable = ({
  projects,
  error,
  isError,
  isPending,
  onRetry,
  pagination,
}: ProjectsTableProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sortBy = searchParams.get("sortBy");
  const sortOrder = searchParams.get("sortOrder");

  const handleSort = (column: ProjectSortField) => {
    const params = new URLSearchParams(searchParams.toString());

    let nextSortOrder: SortOrder = "asc";

    if (sortBy === column) {
      nextSortOrder = sortOrder === "asc" ? "desc" : "asc";
    }

    params.set("sortBy", column);
    params.set("sortOrder", nextSortOrder);

    // Go back to page 1 whenever sorting changes.
    params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`);
  };

  const columnHelper = createColumnHelper<DataTableFeatures, Project>();
  const columns = columnHelper.columns([
    columnHelper.accessor("name", {
      header: () => (
        <SortableHeader
          title="Project"
          sortKey="name"
          currentSortBy={sortBy}
          currentSortOrder={sortOrder}
          onSort={handleSort}
        />
      ),
      cell: ({ row }) => {
        const project = row.original;

        return (
          <Link
            href={`/projects/${project.id}`}
            className="font-medium hover:underline"
          >
            {project.name}
          </Link>
        );
      },
    }),
    columnHelper.accessor("status", {
      header: () => (
        <SortableHeader
          title="Status"
          sortKey="status"
          currentSortBy={sortBy}
          currentSortOrder={sortOrder}
          onSort={handleSort}
        />
      ),
    }),
    columnHelper.accessor("startDate", {
      header: () => (
        <SortableHeader
          title="Start Date"
          sortKey="startDate"
          currentSortBy={sortBy}
          currentSortOrder={sortOrder}
          onSort={handleSort}
        />
      ),
      cell: ({ getValue }) => formatDate(getValue()),
    }),
    columnHelper.accessor("dueDate", {
      header: () => (
        <SortableHeader
          title="Due Date"
          sortKey="dueDate"
          currentSortBy={sortBy}
          currentSortOrder={sortOrder}
          onSort={handleSort}
        />
      ),
      cell: ({ getValue }) => formatDate(getValue()),
    }),
    columnHelper.accessor("createdAt", {
      header: () => (
        <SortableHeader
          title="Created"
          sortKey="createdAt"
          currentSortBy={sortBy}
          currentSortOrder={sortOrder}
          onSort={handleSort}
        />
      ),
      cell: ({ getValue }) => {
        return new Date(getValue()).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      },
    }),
  ]);

  if (isPending) {
    return <LoadingState message="Loading projects..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load projects"
        description={error?.message ?? "Something went wrong"}
        onRetry={onRetry}
      />
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        iconType="folder"
        title="No projects found"
        description="Try changing your search or filters."
      />
    );
  }

  return (
    <>
      <DataTable data={projects} columns={columns} />

      {pagination && (
        <TasksPagination
          limit={pagination.limit}
          page={pagination.page}
          total={pagination.total}
          totalPages={pagination.totalPages}
        />
      )}
    </>
  );
};

export default ProjectsTable;
