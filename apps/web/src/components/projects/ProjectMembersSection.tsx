"use client";

import { useProjectMembers } from "@/hooks/queries/useProjectMembers";
import type { Project } from "@/lib/api/project.api";
import { formatUserName, getDistinctUserEmail } from "@/lib/user-display";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";
import { Badge } from "@/components/ui/badge";

const ProjectMembersSection = ({ project }: { project: Project }) => {
  const membersQuery = useProjectMembers(project.id);

  if (membersQuery.isPending) {
    return (
      <section className="min-w-0 rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Project Members</h2>
        <LoadingState message="Loading project members..." />
      </section>
    );
  }

  if (membersQuery.isError) {
    return (
      <section className="min-w-0 rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Project Members</h2>
        <ErrorState
          title="Failed to load project members"
          description={membersQuery.error.message}
          onRetry={() => void membersQuery.refetch()}
        />
      </section>
    );
  }

  const members = membersQuery.data.filter(
    (member) => member.userId !== project.ownerId,
  );

  return (
    <section className="min-w-0 rounded-xl border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Project Members</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The owner and active members with access to this project.
          </p>
        </div>
        <Badge variant="outline">{members.length + (project.owner ? 1 : 0)} people</Badge>
      </div>

      {!project.owner && members.length === 0 ? (
        <EmptyState
          iconType="users"
          title="No member details available"
          description="There are no active member profiles to display."
        />
      ) : (
        <>
        {members.length === 0 && (
          <p className="mt-5 text-sm text-muted-foreground">No active project members yet.</p>
        )}
        <ul className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {project.owner && (
            <li className="min-w-0 rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 break-words font-medium text-foreground">
                  {formatUserName(project.owner)}
                </p>
                <Badge>Owner</Badge>
              </div>
              {getDistinctUserEmail(project.owner.email, formatUserName(project.owner)) && (
                <p className="mt-2 break-all text-sm text-muted-foreground">
                  {project.owner.email}
                </p>
              )}
            </li>
          )}
          {members.map((member) => {
            const name = formatUserName(member);
            const email = getDistinctUserEmail(member.email, name);
            return (
              <li key={member.userId} className="min-w-0 rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 break-words font-medium text-foreground">
                    {name}
                  </p>
                  <Badge variant="outline">Member</Badge>
                </div>
                {email && (
                  <p className="mt-2 break-all text-sm text-muted-foreground">{email}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </p>
              </li>
            );
          })}
        </ul>
        </>
      )}
    </section>
  );
};

export default ProjectMembersSection;
