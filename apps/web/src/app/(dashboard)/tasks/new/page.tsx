import CreateTaskForm from "@/components/task/CreateTaskForm";
import { getProjectOptions   } from "@/lib/api/project.api";

export default async function CreateTaskPage() {
  const projects = await getProjectOptions();

  const projectOptions = projects.map((project) => ({
    label: project.name,
    value: String(project.id),
  }));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Task</h1>

        <p className="mt-1 text-sm text-gray-500">
          Create a new task and assign it to a project member.
        </p>
      </div>

      <div className="max-w-3xl rounded-xl border bg-white p-6">
        <CreateTaskForm projectOptions={projectOptions} mode="create" />
      </div>
    </div>
  );
}
