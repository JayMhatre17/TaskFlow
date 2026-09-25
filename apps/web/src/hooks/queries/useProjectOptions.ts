import { getProjectOptions } from "@/lib/api/project.api";
import { useQuery } from "@tanstack/react-query";

const useProjectOptions = () => {
  return useQuery({
    queryKey: ["projects", "Options"],
    queryFn: getProjectOptions,
  });
};

export default useProjectOptions;
