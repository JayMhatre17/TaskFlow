import AddMemberForm from "@/components/teams/AddMemberForm";
import EmptyState from "@/components/states/EmptyState";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AddMemberPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string | string[] }>;
}) {
  const { projectId } = await searchParams;
  const projectIdValue = Array.isArray(projectId) ? projectId[0] : projectId;
  const parsedProjectId = Number(projectIdValue);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Add Project Member
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Add an existing TaskFlow user to a project you own.
        </p>
      </div>

      <div className="max-w-3xl rounded-xl border bg-white p-6">
        {Number.isSafeInteger(parsedProjectId) && parsedProjectId > 0 ? (
          <AddMemberForm projectId={parsedProjectId} />
        ) : (
          <EmptyState
            iconType="folder"
            title="Choose a project first"
            description="Select one of your projects from the project members page."
            action={
              <Link href="/team">
                <Button>Choose Project</Button>
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
