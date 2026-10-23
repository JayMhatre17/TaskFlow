"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { toast } from "sonner";
import DataTable, {
  type DataTableFeatures,
} from "@/components/common/DataTable";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";
import { Button } from "@/components/ui/button";
import {
  type ProjectMemberSummary,
} from "@/lib/api/project-collaboration.api";
import { useProjectMembers } from "@/hooks/queries/useProjectMembers";
import { useRemoveProjectMember } from "@/hooks/mutation/useProjectMemberMutations";
import { formatUserName, getDistinctUserEmail } from "@/lib/user-display";

const TeamTable = ({
  projectId,
  canManage,
}: {
  projectId: number;
  canManage: boolean;
}) => {
  const membersQuery = useProjectMembers(projectId);
  const removeMemberMutation = useRemoveProjectMember();
  const columnHelper = createColumnHelper<
    DataTableFeatures,
    ProjectMemberSummary
  >();
  const columns = columnHelper.columns([
    columnHelper.accessor("name", {
      header: "Member",
      cell: ({ row }) => (
        <span className="block max-w-56 whitespace-normal break-words [overflow-wrap:anywhere]">
          {formatUserName(row.original)}
        </span>
      ),
    }),
    columnHelper.accessor("email", {
      header: "Email",
      cell: ({ getValue, row }) => {
        const email = getDistinctUserEmail(getValue(), formatUserName(row.original));
        return email ? (
          <span className="block max-w-56 whitespace-normal break-all">{email}</span>
        ) : "—";
      },
    }),
    columnHelper.accessor("joinedAt", {
      header: "Joined",
      cell: ({ getValue }) =>
        new Date(getValue()).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        if (!canManage) {
          return null;
        }

        const member = row.original;
        const isRemoving =
          removeMemberMutation.isPending &&
          removeMemberMutation.variables?.userId === member.userId;

        return (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={removeMemberMutation.isPending}
            onClick={() =>
              removeMemberMutation.mutate(
                { projectId, userId: member.userId },
                {
                  onSuccess: () => toast.success("Project member removed"),
                  onError: (error) =>
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Unable to remove project member",
                    ),
                },
              )
            }
          >
            {isRemoving ? "Removing..." : "Remove"}
          </Button>
        );
      },
    }),
  ]);

  if (membersQuery.isPending) {
    return <LoadingState message="Loading project members..." />;
  }

  if (membersQuery.isError) {
    return (
      <ErrorState
        title="Failed to load project members"
        description={membersQuery.error.message}
        onRetry={() => void membersQuery.refetch()}
      />
    );
  }

  if (membersQuery.data.length === 0) {
    return (
      <EmptyState
        iconType="users"
        title="No project members yet"
        description="Active members will appear here after they are added to the project."
      />
    );
  }

  return <DataTable data={membersQuery.data} columns={columns} />;
};

export default TeamTable;
