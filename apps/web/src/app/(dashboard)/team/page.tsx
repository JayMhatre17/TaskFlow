import TeamContent from "@/components/teams/TeamContent";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string | string[] }>;
}) {
  const { projectId } = await searchParams;
  const projectIdValue = Array.isArray(projectId) ? projectId[0] : projectId;
  const parsedProjectId = Number(projectIdValue);

  return (
    <TeamContent
      key={parsedProjectId ?? "default-project"}
      initialProjectId={
        Number.isSafeInteger(parsedProjectId) && parsedProjectId > 0
          ? parsedProjectId
          : undefined
      }
    />
  );
}
