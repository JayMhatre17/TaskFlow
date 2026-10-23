import { Activity } from "lucide-react";
import Link from "next/link";
import type { DashboardActivity } from "@/lib/api/dashboard.api";

const RecentActivity = ({ activities }: { activities: DashboardActivity[] }) => {
  const recentActivities = activities.slice(0, 5);

  return (
  <div className="min-w-0 rounded-xl border bg-white p-5">
    <div>
      <h2 className="font-semibold text-gray-900">Recent Activity</h2>
      <p className="mt-1 text-sm text-gray-500">
        Recent task and project changes you can access.
      </p>
    </div>
    <div className="mt-6 space-y-5">
      {recentActivities.length === 0 ? (
        <p className="py-4 text-sm text-gray-500">No activity yet.</p>
      ) : (
        recentActivities.map((activity) => (
          <div key={activity.id} className="flex min-w-0 gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Activity size={18} />
            </div>
            <div className="min-w-0">
              <p className="break-words text-sm font-medium text-gray-900 [overflow-wrap:anywhere]">
                {activity.description ??
                  activity.action.replaceAll("_", " ").toLowerCase()}
              </p>
              <p className="mt-0.5 break-words text-sm text-gray-500 [overflow-wrap:anywhere]">
                {activity.actor?.name ?? "Former user"} ·{" "}
                <Link
                  href={`/projects/${activity.project.id}`}
                  className="hover:text-gray-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {activity.project.name}
                </Link>
                {activity.task && (
                  <>
                    {" · "}
                    <Link
                      href={`/tasks/${activity.task.id}`}
                      className="hover:text-gray-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {activity.task.title}
                    </Link>
                  </>
                )}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {new Date(activity.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
  );
};

export default RecentActivity;
