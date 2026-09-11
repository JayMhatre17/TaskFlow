"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import DataTable from "../common/DataTable";
import { Task } from "@/lib/api/task.api";
import { formatDate } from "@/lib/basicFn";
import Link from "next/link";

type TasksTableProps = {
  tasks: Task[];
};
const columns: ColumnDef<any, Task>[] = [
  {
    accessorKey: "title",
    header: "Task",
    cell: ({ row }) => {
      return (
        <Link href={`/tasks/${row.original.id}`} className="hover:underline">
          {row.original.title}
        </Link>
      );
    },
  },
  {
    accessorKey: "projectId",
    header: "Project",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      return <Badge>{row.original.status}</Badge>;
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      return <Badge variant="outline">{row.original.priority}</Badge>;
    },
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => {
      const dueDate = row.original.dueDate ?? new Date();
      return <p>{formatDate(dueDate)}</p>;
    },
  },
];
const TasksTable = ({ tasks }: TasksTableProps) => {
  return <DataTable data={tasks} columns={columns} />;
};

export default TasksTable;
