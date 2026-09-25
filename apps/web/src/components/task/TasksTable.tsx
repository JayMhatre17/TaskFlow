"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import DataTable from "../common/DataTable";
import { Task, TaskListResponse } from "@/lib/api/task.api";
import { formatDate } from "@/lib/basicFn";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import TasksPagination from "./TasksPagination";

type TasksTableProps = {
  tasks: Task[];
  pagination?: TaskListResponse["pagination"];
};
export type SortBy =
  "title" | "status" | "priority" | "dueDate" | "createdAt" | "updatedAt";
const formatTaskValue = (value: string) => {
  if (!value?.trim()) {
    return "N/A";
  }
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const TasksTable = ({ tasks, pagination }: TasksTableProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSort = (column: SortBy) => {
    const params = new URLSearchParams(searchParams.toString());

    const currentSortBy = params.get("sortBy");
    const currentSortOrder = params.get("sortOrder");

    if (currentSortBy !== column) {
      params.set("sortBy", column);
      params.set("sortOrder", "asc");
    } else {
      params.set("sortOrder", currentSortOrder === "asc" ? "desc" : "asc");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };
  const SortIndicator = ({ column }: { column: SortBy }) => {
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder");

    if (sortBy !== column) {
      return <ChevronsUpDown size={16} />;
    }

    return sortOrder === "asc" ? (
      <ArrowUp size={16} />
    ) : (
      <ArrowDown size={16} />
    );
  };
  const columns: ColumnDef<any, Task>[] = [
    {
      accessorKey: "title",
      header: () => (
        <button
          type="button"
          onClick={() => handleSort("title")}
          className="flex items-center gap-2"
        >
          Task
          <SortIndicator column="title" />
        </button>
      ),
      cell: ({ row }) => {
        return (
          <Link href={`/tasks/${row.original.id}`} className="hover:underline">
            {row.original.title}
          </Link>
        );
      },
    },
    {
      accessorKey: "project",
      header: "Project",
      cell: ({ row }) => {
        return <p>{row.original.project?.name ?? "Unknown project"}</p>;
      },
    },
    {
      accessorKey: "status",
      header: () => (
        <button
          type="button"
          onClick={() => handleSort("status")}
          className="flex items-center gap-2"
        >
          Status
          <SortIndicator column="status" />
        </button>
      ),
      cell: ({ row }) => {
        return <Badge>{formatTaskValue(row.original.status)}</Badge>;
      },
    },
    {
      accessorKey: "priority",
      header: () => (
        <button
          type="button"
          onClick={() => handleSort("priority")}
          className="flex items-center gap-2"
        >
          Priority
          <SortIndicator column="priority" />
        </button>
      ),
      cell: ({ row }) => {
        return (
          <Badge variant="outline">
            {formatTaskValue(row.original.priority)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: () => (
        <button
          type="button"
          onClick={() => handleSort("dueDate")}
          className="flex items-center gap-2"
        >
          Due Date
          <SortIndicator column="dueDate" />
        </button>
      ),
      cell: ({ row }) => {
        const dueDate = row.original.dueDate;

        return <p>{dueDate ? formatDate(dueDate) : "N/A"}</p>;
      },
    },
  ];
  return (
    <>
      <DataTable data={tasks} columns={columns} />{" "}
      <TasksPagination
        limit={pagination?.limit ?? 0}
        page={pagination?.page ?? 0}
        total={pagination?.total ?? 0}
        totalPages={pagination?.totalPages ?? 0}
      />
    </>
  );
};

export default TasksTable;
