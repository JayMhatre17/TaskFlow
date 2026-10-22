import { useQuery } from "@tanstack/react-query";
import {
  getProjectMembers,
  searchProjectMemberCandidates,
} from "@/lib/api/project-collaboration.api";

export const projectCollaborationQueryKeys = {
  invitationsRoot: ["project-invitations"] as const,
  members: (projectId: number) => ["project-members", projectId] as const,
  invitations: (projectId: number) =>
    ["project-invitations", "project", projectId] as const,
  myInvitations: ["project-invitations", "inbox"] as const,
  memberCandidates: (projectId: number, query: string) =>
    ["project-member-candidates", projectId, query] as const,
};

export const useProjectMembers = (projectId: number, enabled = true) =>
  useQuery({
    queryKey: projectCollaborationQueryKeys.members(projectId),
    queryFn: () => getProjectMembers(projectId),
    enabled: enabled && Number.isSafeInteger(projectId) && projectId > 0,
  });

export const useProjectMemberCandidates = (
  projectId: number,
  query: string,
) =>
  useQuery({
    queryKey: projectCollaborationQueryKeys.memberCandidates(
      projectId,
      query.trim(),
    ),
    queryFn: () => searchProjectMemberCandidates(projectId, query.trim()),
    enabled:
      Number.isSafeInteger(projectId) &&
      projectId > 0 &&
      query.trim().length >= 2 &&
      query.trim().length <= 100,
  });
