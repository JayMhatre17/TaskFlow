import { updateProject, UpdateProjectInput } from "@/lib/api/project.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
type UpdateProjectVariables = {
  id: number;
  data: UpdateProjectInput;
};
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, id }: UpdateProjectVariables) =>
      updateProject(id, data),
    onSuccess: (project) => {
      // Update the specific project cache
      queryClient.invalidateQueries({
        queryKey: ["project", project.id],
      });

      // Update the projects list cache
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
    },
  });
};
