import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTaskComment } from "@/lib/api/task.api";
import { taskActivityQueryKeys } from "@/hooks/queries/useTaskActivities";
import { taskCommentQueryKeys } from "@/hooks/queries/useTaskComments";

type CreateTaskCommentInput = {
  taskId: number;
  content: string;
};

export const useCreateTaskComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, content }: CreateTaskCommentInput) =>
      createTaskComment(taskId, content),
    onSuccess: async (_result, { taskId }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: taskCommentQueryKeys.list(taskId),
        }),
        queryClient.invalidateQueries({
          queryKey: taskActivityQueryKeys.list(taskId),
        }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
    },
  });
};
