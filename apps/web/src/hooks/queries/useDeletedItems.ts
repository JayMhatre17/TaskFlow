import { useQuery } from "@tanstack/react-query";
import { getDeletedProjects } from "@/lib/api/project.api";
import { getDeletedTasks } from "@/lib/api/task.api";

export const useDeletedProjects = () =>
  useQuery({
    queryKey: ["deleted-projects"],
    queryFn: getDeletedProjects,
  });

export const useDeletedTasks = () =>
  useQuery({
    queryKey: ["deleted-tasks"],
    queryFn: getDeletedTasks,
  });
