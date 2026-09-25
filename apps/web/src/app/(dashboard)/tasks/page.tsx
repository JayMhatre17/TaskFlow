import TasksContent from "@/components/task/TaskContent";
import TasksHeader from "@/components/task/TasksHeader";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <TasksHeader />
      
      <TasksContent />
    </div>
  );
}
