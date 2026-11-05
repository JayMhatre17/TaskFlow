import CreateTaskFormWithProjects from "@/components/task/CreateTaskFormWithProjects";

export default async function CreateTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string | string[] }>;
}) {
  const params = await searchParams;
  const projectIdValue = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;
  const projectId = Number(projectIdValue);
  const initialProjectId =
    Number.isSafeInteger(projectId) && projectId > 0 ? projectId : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create Task</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Create a new task and assign it to a project member.
        </p>
      </div>

      <div className="max-w-3xl rounded-xl border bg-card p-6">
        <CreateTaskFormWithProjects initialProjectId={initialProjectId} />
      </div>
    </div>
  );
}
