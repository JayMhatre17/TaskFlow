"use client";
import { getProject } from "@/lib/api/project.api";
import { useQuery } from "@tanstack/react-query";

const useProject = (id: number) => {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id),
    enabled: Number.isSafeInteger(id) && id > 0,
  });
};

export default useProject;
