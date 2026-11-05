import { createTask, CreateTaskInput } from "@/lib/api/task.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectTaskOverviewQueryKeys } from "@/hooks/queries/useProjectTaskOverview";

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskInput) => createTask(data),
    onSuccess: async (_, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({
          queryKey: ["project-tasks", input.projectId],
        }),
        queryClient.invalidateQueries({
          queryKey: projectTaskOverviewQueryKeys.project(input.projectId),
        }),
      ]);
    },
  });
};
