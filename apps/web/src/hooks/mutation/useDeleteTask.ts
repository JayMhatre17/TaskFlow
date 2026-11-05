import { deleteTask } from "@/lib/api/task.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectTaskOverviewQueryKeys } from "@/hooks/queries/useProjectTaskOverview";

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => deleteTask(taskId),
    onSuccess: async (_, taskId: number) => {
      const task = queryClient.getQueryData<{ projectId: number }>([
        "task",
        taskId,
      ]);
      queryClient.removeQueries({
        queryKey: ["task", taskId],
        exact: true,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({
          queryKey: task ? ["project-tasks", task.projectId] : ["project-tasks"],
        }),
        queryClient.invalidateQueries({
          queryKey: task
            ? projectTaskOverviewQueryKeys.project(task.projectId)
            : projectTaskOverviewQueryKeys.all,
        }),
      ]);
    },
  });
};
