import TasksContent from "@/components/task/TaskContent";
import TaskFilters from "@/components/task/TaskFilters";
import TasksHeader from "@/components/task/TasksHeader";
import TasksPagination from "@/components/task/TasksPagination";

export default async function TasksPage() {
  return (
    <div className="space-y-6">
      <TasksHeader />
      <TaskFilters />
      <TasksContent />
      <TasksPagination />
    </div>
  );
}
