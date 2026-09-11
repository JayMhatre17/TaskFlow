import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

const ProjectsHeader = () => {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage and track your workspace projects.
        </p>
      </div>

      <Link href="/projects/create">
        <Button>
          <Plus size={18} />
          Create Project
        </Button>
      </Link>
    </div>
  );
};

export default ProjectsHeader;
