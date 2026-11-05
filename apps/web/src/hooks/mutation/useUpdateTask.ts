import { updateTask, UpdateTaskInput } from "@/lib/api/task.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task } from "@/lib/api/task.api";
import { projectTaskOverviewQueryKeys } from "@/hooks/queries/useProjectTaskOverview";

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, id }: { data: UpdateTaskInput; id: number }) =>
      updateTask(id, data),
    onSuccess: async (task, { id }) => {
      const previousTask = queryClient.getQueryData<Task>(["task", id]);
      const projectIds = new Set([task.projectId, previousTask?.projectId]);
      // Update/invalidate the individual task
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["task", task.id] }),
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        ...[...projectIds].flatMap((projectId) =>
          projectId === undefined
            ? []
            : [
                queryClient.invalidateQueries({
                  queryKey: ["project-tasks", projectId],
                }),
                queryClient.invalidateQueries({
                  queryKey: projectTaskOverviewQueryKeys.project(projectId),
                }),
              ],
        ),
      ]);
    },
  });
};
