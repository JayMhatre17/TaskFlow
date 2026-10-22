import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cancelProjectInvitation,
  createProjectInvitation,
  type CancelProjectInvitationInput,
  type CreateProjectInvitationInput,
} from "@/lib/api/project-collaboration.api";
import { projectCollaborationQueryKeys } from "@/hooks/queries/useProjectMembers";

export const useCreateProjectInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInvitationInput) =>
      createProjectInvitation(input),
    gcTime: 0,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: projectCollaborationQueryKeys.invitationsRoot,
      });
    },
  });
};

export const useCancelProjectInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CancelProjectInvitationInput) =>
      cancelProjectInvitation(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: projectCollaborationQueryKeys.invitationsRoot,
      });
    },
  });
};
