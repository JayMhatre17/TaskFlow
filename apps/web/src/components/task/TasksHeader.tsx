import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const TasksHeader = () => {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tasks</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage and track tasks across your projects.
        </p>
      </div>

      <Link href="/tasks/new">
        <Button className="cursor-pointer">
          <Plus size={18} />
          Create Task
        </Button>
      </Link>
    </div>
  );
};

export default TasksHeader;
