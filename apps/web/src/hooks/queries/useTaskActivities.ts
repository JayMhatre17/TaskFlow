import { useQuery } from "@tanstack/react-query";
import { getTaskActivities } from "@/lib/api/task.api";

export const taskActivityQueryKeys = {
  list: (taskId: number) => ["task-activities", taskId] as const,
};

export const useTaskActivities = (taskId: number) =>
  useQuery({
    queryKey: taskActivityQueryKeys.list(taskId),
    queryFn: () => getTaskActivities(taskId),
    enabled: Number.isSafeInteger(taskId) && taskId > 0,
  });
