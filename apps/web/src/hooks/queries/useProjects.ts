"use client";
import { getProjects, ProjectQueryParams } from "@/lib/api/project.api";
import { useQuery } from "@tanstack/react-query";

export const useProjects = (params?: ProjectQueryParams) => {
  return useQuery({
    queryKey: ["projects", params],
    queryFn: () => getProjects(params),
  });
};
