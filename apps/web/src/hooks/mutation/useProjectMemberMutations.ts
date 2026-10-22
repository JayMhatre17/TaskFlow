import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addProjectMember,
  removeProjectMember,
  type AddProjectMemberInput,
  type RemoveProjectMemberInput,
} from "@/lib/api/project-collaboration.api";
import { projectCollaborationQueryKeys } from "@/hooks/queries/useProjectMembers";

export const useAddProjectMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddProjectMemberInput) => addProjectMember(input),
    onSuccess: async (_, { projectId }) => {
      await queryClient.invalidateQueries({
        queryKey: projectCollaborationQueryKeys.members(projectId),
      });
    },
  });
};

export const useRemoveProjectMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RemoveProjectMemberInput) => removeProjectMember(input),
    onSuccess: async (_, { projectId }) => {
      await queryClient.invalidateQueries({
        queryKey: projectCollaborationQueryKeys.members(projectId),
      });
    },
  });
};
