import { useQuery } from "@tanstack/react-query";
import { getTaskComments } from "@/lib/api/task.api";

export const taskCommentQueryKeys = {
  list: (taskId: number) => ["task-comments", taskId] as const,
};

export const useTaskComments = (taskId: number) =>
  useQuery({
    queryKey: taskCommentQueryKeys.list(taskId),
    queryFn: () => getTaskComments(taskId),
    enabled: Number.isSafeInteger(taskId) && taskId > 0,
  });
