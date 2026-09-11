import { getTasksByProject } from "@/lib/api/project.api";
import { useQuery } from "@tanstack/react-query";

export const useProjectTasks = (projectId: number, enabled = true) => {
  return useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: () => getTasksByProject(projectId),
    enabled: enabled && Number.isInteger(projectId),
  });
};
