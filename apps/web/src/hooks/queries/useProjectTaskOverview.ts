import { useQuery } from "@tanstack/react-query";
import { getProjectTaskOverview } from "@/lib/api/project.api";

export const projectTaskOverviewQueryKeys = {
  all: ["project-task-overview"] as const,
  project: (projectId: number) => ["project-task-overview", projectId] as const,
};

export const useProjectTaskOverview = (
  projectId: number,
  enabled = true,
) =>
  useQuery({
    queryKey: projectTaskOverviewQueryKeys.project(projectId),
    queryFn: () => getProjectTaskOverview(projectId),
    enabled: enabled && Number.isSafeInteger(projectId) && projectId > 0,
  });
