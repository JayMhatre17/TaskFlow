import ProjectDetails from "@/components/projects/ProjectDetails";

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProjectDetails id={Number(id)} />;
}
