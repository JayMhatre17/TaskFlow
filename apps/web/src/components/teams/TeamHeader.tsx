import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const TeamHeader = ({ projectId }: { projectId?: number }) => {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Project Members</h1>

        <p className="mt-1 text-sm text-gray-500">
          View and manage members for a project you own.
        </p>
      </div>
      {projectId && (
        <Link href={`/team/new?projectId=${projectId}`}>
          <Button>
            <Plus size={18} />
            Add Member
          </Button>
        </Link>
      )}
    </div>
  );
};

export default TeamHeader;
