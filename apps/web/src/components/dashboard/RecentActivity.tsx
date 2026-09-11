import { CheckCircle2, FolderPlus, UserPlus } from "lucide-react";
import React from "react";
const activities = [
  {
    id: 1,
    icon: FolderPlus,
    title: "New project created",
    description: "TaskFlow Website was created",
    time: "10 minutes ago",
  },
  {
    id: 2,
    icon: CheckCircle2,
    title: "Task completed",
    description: "Authentication UI was completed",
    time: "1 hour ago",
  },
  {
    id: 3,
    icon: UserPlus,
    title: "New team member",
    description: "Rahul joined the workspace",
    time: "3 hours ago",
  },
];
const RecentActivity = () => {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div>
        <h2 className="font-semibold text-gray-900">Recent Activity</h2>

        <p className="mt-1 text-sm text-gray-500">
          Recent activity in your workspace.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {activities.map((activity) => {
          const Icon = activity.icon;

          return (
            <div key={activity.id} className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <Icon size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>

                <p className="mt-0.5 text-sm text-gray-500">
                  {activity.description}
                </p>

                <p className="mt-1 text-xs text-gray-400">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;
