"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";

import { teamMembers, type TeamMember } from "./team-data";
import DataTable from "../common/DataTable";

const columns: ColumnDef<any, TeamMember>[] = [
  {
    accessorKey: "name",
    header: "Member",
    cell: ({ row }) => {
      const member = row.original;

      return (
        <div>
          <p className="font-medium">{member.name}</p>
          <p className="text-sm text-gray-500">{member.email}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge>{row.original.status}</Badge>,
  },
  {
    accessorKey: "projects",
    header: "Projects",
  },
];

const TeamTable = () => {
  return <DataTable data={teamMembers} columns={columns} />;
};

export default TeamTable;
