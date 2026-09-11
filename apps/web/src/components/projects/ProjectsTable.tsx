"use client";

import type { ColumnDef } from "@tanstack/react-table";

import DataTable from "@/components/common/DataTable";
import type { Project } from "@/lib/api/project.api";
import Link from "next/link";
import { formatDate } from "@/lib/basicFn";

const columns: ColumnDef<any, Project>[] = [
  {
    accessorKey: "name",
    header: "Project",
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
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ getValue }) => {
      const value = getValue<string>();

      return formatDate(value);
    },
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ getValue }) => {
      const value = getValue<string>();

      return formatDate(value);
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ getValue }) => {
      const value = getValue<string>();

      return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    },
  },
];

const ProjectsTable = ({ projects }: { projects: Project[] }) => {
  return <DataTable data={projects} columns={columns} />;
};

export default ProjectsTable;
