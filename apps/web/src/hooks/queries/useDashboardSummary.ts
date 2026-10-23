import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@/lib/api/dashboard.api";

export const dashboardSummaryQueryKey = ["dashboard-summary"] as const;

export const useDashboardSummary = () =>
  useQuery({
    queryKey: dashboardSummaryQueryKey,
    queryFn: getDashboardSummary,
  });
