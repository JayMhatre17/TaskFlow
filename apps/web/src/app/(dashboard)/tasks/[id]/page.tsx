import { notFound } from "next/navigation";
import TaskDetailsContent from "@/components/task/TaskDetailsContent";

export default async function TaskDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const taskId = Number(id);

  if (!Number.isInteger(taskId)) {
    notFound();
  }

  return <TaskDetailsContent taskId={taskId} />;
}
