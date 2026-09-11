import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ProjectFilters = () => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <Input placeholder="Search projects..." className="pl-9" />
      </div>

      <Select>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>

        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value="all" label="All Status">
            All Status
          </SelectItem>

          <SelectItem value="active" label="Active">
            Active
          </SelectItem>

          <SelectItem value="completed" label="Completed">
            Completed
          </SelectItem>

          <SelectItem value="on-hold" label="On Hold">
            On Hold
          </SelectItem>
        </SelectContent>
      </Select>

      <Select>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>

        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value="newest" label="Newest">
            Newest
          </SelectItem>

          <SelectItem value="oldest" label="Oldest">
            Oldest
          </SelectItem>

          <SelectItem value="name-asc" label="Name A-Z">
            Name A-Z
          </SelectItem>

          <SelectItem value="name-desc" label="Name Z-A">
            Name Z-A
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProjectFilters;
