import DashboardStatsCard from "@/components/dashboard/DashboardStatsCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import RecentProjects from "@/components/dashboard/RecentProjects";
import RecentTasks from "@/components/dashboard/RecentTasks";
import TaskOverview from "@/components/dashboard/TaskOverview";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your workspace.
        </p>
      </div>

      <DashboardStatsCard />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TaskOverview />
        <RecentActivity />
      </div>
      <RecentProjects />
      <RecentTasks />
    </div>
  );
}
