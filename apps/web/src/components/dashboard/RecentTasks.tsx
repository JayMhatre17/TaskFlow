import Link from "next/link";
import { Badge } from "../ui/badge";
import type { Task } from "@/lib/api/task.api";

const RecentTasks = ({ tasks }: { tasks: Task[] }) => (
  <div className="min-w-0 rounded-xl border bg-white p-5">
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-semibold text-gray-900">Recent Tasks</h2>
        <p className="mt-1 text-sm text-gray-500">
          Recently updated tasks in projects you can access.
        </p>
      </div>
      <Link
        href="/tasks"
        className="shrink-0 text-sm font-medium text-gray-600 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        View all
      </Link>
    </div>
    <div className="mt-6 divide-y">
      {tasks.length === 0 ? (
        <p className="py-4 text-sm text-gray-500">No recent tasks.</p>
      ) : (
        tasks.map((task) => (
          <Link
            key={task.id}
            href={`/tasks/${task.id}`}
            title={task.title}
            className="block min-w-0 py-4 first:pt-0 last:pb-0 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="break-words font-medium text-gray-900 [overflow-wrap:anywhere]">{task.title}</h3>
                <p className="mt-1 break-words text-sm text-gray-500 [overflow-wrap:anywhere]">
                  {task.project?.name ?? "Project"}
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  Updated {new Date(task.updatedAt).toLocaleString()}
                </p>
              </div>
              <Badge
                className="shrink-0"
                variant={
                  task.status === "COMPLETED"
                    ? "secondary"
                    : task.status === "IN_PROGRESS"
                      ? "default"
                      : "outline"
                }
              >
                {task.status.replaceAll("_", " ")}
              </Badge>
            </div>
          </Link>
        ))
      )}
    </div>
  </div>
);

export default RecentTasks;
