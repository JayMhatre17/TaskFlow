import { notFound } from "next/navigation";
import { getProject } from "@/lib/api/project.api";
import ProjectForm from "@/components/projects/ProjectForm";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const projectId = Number(id);

  if (!Number.isInteger(projectId)) {
    notFound();
  }

  const project = await getProject(projectId);

  const defaultValues = {
    name: project?.name,
    description: project?.description ?? "",
    status: project?.status,
    startDate: project?.startDate.slice(0, 10),
    dueDate: project?.dueDate.slice(0, 10),
  };

  return (
    <ProjectForm
      mode="edit"
      projectId={project.id}
      defaultValues={defaultValues}
    />
  );
}
