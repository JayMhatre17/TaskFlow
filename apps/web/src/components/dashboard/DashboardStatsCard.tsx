import { CheckCircle, Clock3, FolderKanban, ListTodo } from "lucide-react";
import StatsCard from "./StatsCard";
import type { DashboardSummary } from "@/lib/api/dashboard.api";

const DashboardStatsCard = ({ stats }: { stats: DashboardSummary["stats"] }) => {
  const cards = [
  {
    label: "Active Projects",
    value: stats.activeProjects,
    icon: FolderKanban,
    href: "/projects?status=Active",
  },
  {
    label: "Open Tasks",
    value: stats.openTasks,
    icon: ListTodo,
  },
  {
    label: "Completed Tasks",
    value: stats.completedTasks,
    icon: CheckCircle,
    href: "/tasks?status=COMPLETED",
  },
  {
    label: "Overdue Tasks",
    value: stats.overdueTasks,
    icon: Clock3,
  },
];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((stat) => (
        <StatsCard key={stat.label} {...stat} />
      ))}
    </div>
  );
};

export default DashboardStatsCard;
