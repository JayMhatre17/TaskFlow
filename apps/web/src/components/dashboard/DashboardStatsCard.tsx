import { CheckCircle, FolderKanban, ListTodo, Users } from "lucide-react";
import StatsCard from "./StatsCard";

const stats = [
  {
    label: "Total Projects",
    value: 12,
    icon: FolderKanban,
  },
  {
    label: "Active Tasks",
    value: 24,
    icon: ListTodo,
  },
  {
    label: "Team Members",
    value: 8,
    icon: Users,
  },
  {
    label: "Completed",
    value: 67,
    icon: CheckCircle,
  },
];
const DashboardStatsCard = () => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatsCard key={stat.label} {...stat} />
      ))}
    </div>
  );
};

export default DashboardStatsCard;
