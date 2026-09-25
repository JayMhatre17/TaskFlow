import { updateTask, UpdateTaskInput } from "@/lib/api/task.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, id }: { data: UpdateTaskInput; id: number }) =>
      updateTask(id, data),
    onSuccess: (task) => {
      // Update/invalidate the individual task
      queryClient.invalidateQueries({
        queryKey: ["task", task.id],
      });

      // Update the task list
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });
    },
  });
};
