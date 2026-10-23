import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignTask, type AssignTaskInput } from "@/lib/api/task.api";

type AssignTaskMutationInput = AssignTaskInput & {
  taskId: number;
  projectId: number;
};

export const useAssignTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AssignTaskMutationInput) => {
      const result = await assignTask(input.taskId, {
        assigneeId: input.assigneeId,
        reason: input.reason,
      });

      if (!result.task) {
        throw new Error("Task assignment could not be saved. Please retry.");
      }

      return result;
    },
    onSuccess: async (_result, { taskId, projectId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["task", taskId] }),
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({
          queryKey: ["project-tasks", projectId],
        }),
      ]);
    },
  });
};
