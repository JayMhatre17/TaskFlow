import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteProject } from "@/lib/api/project.api";

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteProject(id),

    onSuccess: (_, id) => {
      // Remove the deleted project's detail cache
      queryClient.removeQueries({
        queryKey: ["project", id],
      });

      // Refresh the projects list
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
    },
  });
};
