import { getTask } from "@/lib/api/task.api";
import { useQuery } from "@tanstack/react-query";

export const useTask = (id: number) => {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => getTask(id),
    enabled: Number.isInteger(id),
  });
};
