import Link from "next/link";
import TaskChart from "./TaskChart";
import type { DashboardSummary } from "@/lib/api/dashboard.api";

const TaskOverview = ({ counts }: { counts: DashboardSummary["taskStatusCounts"] }) => {
  const taskStats = [
    { status: "To Do", filter: "TODO", value: counts.todo },
    { status: "In Progress", filter: "IN_PROGRESS", value: counts.inProgress },
    { status: "In Review", filter: "IN_REVIEW", value: counts.inReview },
    { status: "Completed", filter: "COMPLETED", value: counts.completed },
  ];
  const totalTasks = taskStats.reduce((total, task) => total + task.value, 0);
  return (
    <div className="min-w-0 rounded-xl border bg-white p-5">
      <div>
        <h2 className="font-semibold text-gray-900">Task Overview</h2>

        <p className="mt-1 text-sm text-gray-500">
          Overview of your current tasks.
        </p>
      </div>

      <div className="mt-6">
        <p className="text-sm text-gray-500">Total Tasks</p>

        <p className="mt-1 text-3xl font-bold text-gray-900">{totalTasks}</p>
      </div>
      <div className="mt-4 min-w-0 max-w-full">
        {totalTasks === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            No tasks in your projects yet.
          </p>
        ) : (
          <TaskChart data={taskStats} />
        )}
      </div>
      <nav
        aria-label="Browse tasks by status"
        className="mt-4 grid min-w-0 grid-cols-2 gap-2 border-t pt-4 sm:grid-cols-4"
      >
        {taskStats.map((task) => (
          <Link
            key={task.filter}
            href={`/tasks?status=${task.filter}`}
            className="min-w-0 rounded-md px-2 py-2 text-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="block break-words text-gray-500">{task.status}</span>
            <span className="font-semibold text-gray-900">{task.value}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default TaskOverview;
