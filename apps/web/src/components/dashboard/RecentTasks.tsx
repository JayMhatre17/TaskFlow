import Link from "next/link";
import { Badge } from "../ui/badge";

type Task = {
  id: number;
  title: string;
  projectName: string;
  status: "Todo" | "In Progress" | "Completed";
  updatedAt: string;
};

const tasks: Task[] = [
  {
    id: 1,
    title: "Setup authentication",
    projectName: "TaskFlow Website",
    status: "In Progress",
    updatedAt: "20 minutes ago",
  },
  {
    id: 2,
    title: "Create login page",
    projectName: "TaskFlow Website",
    status: "Todo",
    updatedAt: "1 hour ago",
  },
  {
    id: 3,
    title: "Design dashboard",
    projectName: "Mobile App",
    status: "Completed",
    updatedAt: "Yesterday",
  },
];
const RecentTasks = () => {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Recent Tasks</h2>

          <p className="mt-1 text-sm text-gray-500">
            Recently updated tasks in your workspace.
          </p>
        </div>

        <Link
          href="/tasks"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          View all
        </Link>
      </div>

      <div className="mt-6 divide-y">
        {tasks.map((task) => (
          <Link
            key={task.id}
            href={`/tasks/${task.id}`}
            className="block py-4 first:pt-0 last:pb-0 hover:bg-gray-50"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-medium text-gray-900">{task.title}</h3>

                <p className="mt-1 text-sm text-gray-500">{task.projectName}</p>

                <p className="mt-2 text-xs text-gray-400">
                  Updated {task.updatedAt}
                </p>
              </div>

              <Badge
                variant={
                  task.status === "Completed"
                    ? "secondary"
                    : task.status === "In Progress"
                      ? "default"
                      : "outline"
                }
              >
                {task.status}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecentTasks;
