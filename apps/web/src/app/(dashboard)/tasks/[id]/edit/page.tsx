import { notFound } from "next/navigation";
import EditTaskFormContent from "@/components/task/EditTaskFormContent";

type EditTaskPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { id } = await params;

  const taskId = Number(id);

  if (!Number.isInteger(taskId)) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Task</h1>

        <p className="text-muted-foreground">Update the task details.</p>
      </div>

      <EditTaskFormContent taskId={taskId} />
    </div>
  );
}
