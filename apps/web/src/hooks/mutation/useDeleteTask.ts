import { deleteTask } from "@/lib/api/task.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => deleteTask(taskId),
    onSuccess: (_, taskId: number) => {
      queryClient.removeQueries({
        queryKey: ["task", taskId],
        exact: true,
      });

      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });
    },
  });
};
