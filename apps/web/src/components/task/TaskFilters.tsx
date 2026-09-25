"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "../ui/button";
import { useState } from "react";
import useProjectOptions from "@/hooks/queries/useProjectOptions";
const statusOptions = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "COMPLETED", label: "Completed" },
];
const priorityOptions = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];
type FilterKey = "status" | "priority" | "projectId";
type TaskFiltersProps = {
  onRefresh: () => void;
  isRefreshing: boolean;
};
const TaskFilters = ({ isRefreshing, onRefresh }: TaskFiltersProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const { data: projects } = useProjectOptions();
  const selectedProject = projects?.find(
    (project) => String(project.id) === searchParams.get("projectId"),
  );

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFilterChange = (key: FilterKey, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };
  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("search");
    params.delete("status");
    params.delete("priority");
    params.delete("projectId");

    params.set("page", "1");

    setSearch("");

    router.push(`${pathname}?${params.toString()}`);
  };
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1 ">
        <div className="flex">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="Search tasks..."
          />

          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>

      <Select
        value={searchParams.get("status") ?? "all"}
        onValueChange={(value) => handleFilterChange("status", value)}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Status">
            {statusOptions.find(
              (option) => option.value === searchParams.get("status"),
            )?.label ?? "All Status"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>

          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("priority") ?? "all"}
        onValueChange={(value) => handleFilterChange("priority", value)}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Priority">
            {priorityOptions.find(
              (option) => option.value === searchParams.get("priority"),
            )?.label ?? "All Priorities"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>

          {priorityOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("projectId") ?? "all"}
        onValueChange={(value) => handleFilterChange("projectId", value)}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Project">
            {selectedProject?.name ?? "All Projects"}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>

          {projects?.map((project) => (
            <SelectItem key={project.id} value={String(project.id)}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        onClick={handleClearFilters}
        className="cursor-pointer"
      >
        Clear Filters
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        {isRefreshing ? "Refreshing..." : "Refresh"}
      </Button>
    </div>
  );
};

export default TaskFilters;
