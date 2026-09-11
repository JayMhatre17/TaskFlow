import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteProject } from "@/lib/api/project.api";

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteProject(id),

    onSuccess: (_, projectId) => {
      queryClient.removeQueries({
        queryKey: ["project", projectId],
        exact: true,
      });

      queryClient.removeQueries({
        queryKey: ["project-tasks", projectId],
        exact: true,
      });

      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
    },
  });
};
