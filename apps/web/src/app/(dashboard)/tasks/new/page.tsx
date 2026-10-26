import CreateTaskFormWithProjects from "@/components/task/CreateTaskFormWithProjects";

export default function CreateTaskPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create Task</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Create a new task and assign it to a project member.
        </p>
      </div>

      <div className="max-w-3xl rounded-xl border bg-card p-6">
        <CreateTaskFormWithProjects />
      </div>
    </div>
  );
}
