"use client";

import DashboardStatsCard from "./DashboardStatsCard";
import RecentActivity from "./RecentActivity";
import RecentProjects from "./RecentProjects";
import RecentTasks from "./RecentTasks";
import TaskOverview from "./TaskOverview";
import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";
import { useDashboardSummary } from "@/hooks/queries/useDashboardSummary";

export default function DashboardContent() {
  const summary = useDashboardSummary();

  if (summary.isPending) {
    return <LoadingState message="Loading your dashboard..." />;
  }

  if (summary.isError) {
    return (
      <ErrorState
        title="Couldn't load your dashboard"
        description="Please check your connection and try again."
        onRetry={() => void summary.refetch()}
      />
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <DashboardStatsCard stats={summary.data.stats} />
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <TaskOverview counts={summary.data.taskStatusCounts} />
        <RecentActivity activities={summary.data.recentActivity} />
      </div>
      <RecentProjects projects={summary.data.recentProjects} />
      <RecentTasks tasks={summary.data.recentTasks} />
    </div>
  );
}
