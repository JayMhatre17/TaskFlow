import { notFound } from "next/navigation";
import ProjectEditContent from "@/components/projects/ProjectEditContent";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projectId = Number(id);

  if (!Number.isSafeInteger(projectId) || projectId <= 0) {
    notFound();
  }

  return (
    <div className="mx-auto min-w-0 w-full max-w-3xl space-y-6">
      <div>
        <h1 className="break-words text-2xl font-semibold">Edit Project</h1>
        <p className="text-muted-foreground">Update the project details.</p>
      </div>
      <ProjectEditContent projectId={projectId} />
    </div>
  );
}
