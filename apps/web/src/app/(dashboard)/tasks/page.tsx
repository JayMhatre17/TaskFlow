import TaskFilters from "@/components/task/TaskFilters";
import TasksHeader from "@/components/task/TasksHeader";
import TasksPagination from "@/components/task/TasksPagination";
import TasksTable from "@/components/task/TasksTable";
import { getTasks } from "@/lib/api/task.api";

export default async function TasksPage() {
  const tasks = await getTasks();
  console.log(tasks);
  return (
    <div className="space-y-6">
      <TasksHeader />
      <TaskFilters />
      <TasksTable tasks={tasks} />
      <TasksPagination />
    </div>
  );
}
