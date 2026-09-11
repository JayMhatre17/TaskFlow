import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const TeamHeader = () => {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage the members of your workspace.
        </p>
      </div>
      <Link href="/team/new">
        <Button>
          <Plus size={18} />
          Add Member
        </Button>
      </Link>
    </div>
  );
};

export default TeamHeader;
