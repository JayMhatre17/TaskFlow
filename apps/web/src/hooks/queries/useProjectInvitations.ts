import { useQuery } from "@tanstack/react-query";
import { getProjectInvitations } from "@/lib/api/project-collaboration.api";
import { projectCollaborationQueryKeys } from "./useProjectMembers";

export const useProjectInvitations = (projectId: number, enabled = true) =>
  useQuery({
    queryKey: projectCollaborationQueryKeys.invitations(projectId),
    queryFn: () => getProjectInvitations(projectId),
    enabled: enabled && Number.isSafeInteger(projectId) && projectId > 0,
  });
