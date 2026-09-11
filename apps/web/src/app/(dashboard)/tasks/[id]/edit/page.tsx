import { notFound } from "next/navigation";
import CreateTaskForm from "@/components/task/CreateTaskForm";
import { getTask } from "@/lib/api/task.api";
import { getProjects } from "@/lib/api/project.api";

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

  const [task, projects] = await Promise.all([getTask(taskId), getProjects()]);

  if (!task) {
    notFound();
  }

  const projectOptions = projects.map((project) => ({
    label: project.name,
    value: String(project.id),
  }));

  const defaultValues = {
    title: task.title,
    description: task.description ?? "",
    projectId: String(task.projectId),
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Task</h1>

        <p className="text-muted-foreground">Update the task details.</p>
      </div>

      <CreateTaskForm
        mode="edit"
        taskId={task.id}
        defaultValues={defaultValues}
        projectOptions={projectOptions}
      />
    </div>
  );
}
