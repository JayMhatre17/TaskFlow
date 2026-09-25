import { getTasks } from "@/lib/api/task.api";
import { useQuery } from "@tanstack/react-query";

export const useTasks = (
  page: number,
  limit: number,
  search?: string,
  status?: string,
  priority?: string,
  projectId?: string,
  sortBy?: string,
  sortOrder?: string,
) => {
  return useQuery({
    queryKey: ["tasks", page, limit, search, status, priority,projectId, sortBy, sortOrder],
    queryFn: () => getTasks(page, limit, search, status, priority,projectId, sortBy, sortOrder),
  });
};
