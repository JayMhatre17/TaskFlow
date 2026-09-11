import TaskChart from "./TaskChart";

const taskStats = [
  {
    status: "Todo",
    value: 12,
  },
  {
    status: "In Progress",
    value: 8,
  },
  {
    status: "Completed",
    value: 24,
  },
];
const TaskOverview = () => {
  const totalTasks = taskStats.reduce((total, task) => total + task.value, 0);
  return (
    <div className="rounded-xl border bg-white p-5">
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
      <div className="mt-4">
        <TaskChart data={taskStats} />
      </div>
    </div>
  );
};

export default TaskOverview;
