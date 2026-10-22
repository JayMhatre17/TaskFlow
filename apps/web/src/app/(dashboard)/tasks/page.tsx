import { Suspense } from "react";
import LoadingState from "@/components/states/LoadingState";
import TasksContent from "@/components/task/TaskContent";
import TasksHeader from "@/components/task/TasksHeader";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <TasksHeader />
      <Suspense fallback={<LoadingState message="Loading tasks..." />}>
        <TasksContent />
      </Suspense>
    </div>
  );
}
