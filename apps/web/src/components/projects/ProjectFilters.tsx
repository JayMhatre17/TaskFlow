"use client";

import { RefreshCw, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "../ui/button";

const statusOptions = [
  {
    value: "Active",
    label: "Active",
  },
  {
    value: "On Hold",
    label: "On Hold",
  },
];

const sortOptions = [
  {
    value: "createdAt-desc",
    label: "Newest",
  },
  {
    value: "createdAt-asc",
    label: "Oldest",
  },
  {
    value: "name-asc",
    label: "Name A-Z",
  },
  {
    value: "name-desc",
    label: "Name Z-A",
  },
];

type FilterKey = "status";

type ProjectFiltersProps = {
  onRefetch: () => void;
  isRefetching?: boolean;
};

const ProjectFilters = ({
  onRefetch,
  isRefetching = false,
}: ProjectFiltersProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (search.trim()) {
      params.set("search", search.trim());
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

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || value === "default") {
      params.delete("sortBy");
      params.delete("sortOrder");
    } else {
      const [sortBy, sortOrder] = value.split("-");

      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
    }

    params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`);
  };

  const currentSort =
    searchParams.get("sortBy") && searchParams.get("sortOrder")
      ? `${searchParams.get("sortBy")}-${searchParams.get("sortOrder")}`
      : "default";
  const handleClearFilters = () => {
    setSearch("");

    const params = new URLSearchParams(searchParams.toString());

    params.delete("search");
    params.delete("status");
    params.delete("sortBy");
    params.delete("sortOrder");
    params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`);
  };
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {/* Search */}
      <div className="relative flex-1">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <div className="flex">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="Search projects..."
            className="pl-9"
          />

          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>

      {/* Status */}
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

        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value="all">All Status</SelectItem>

          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sorting */}
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Sort by">
            {sortOptions.find((option) => option.value === currentSort)
              ?.label ?? "Sort by"}
          </SelectValue>
        </SelectTrigger>

        <SelectContent alignItemWithTrigger={false}>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={handleClearFilters}>
        <X size={16} />
        Clear
      </Button>

      <Button
        variant="outline"
        onClick={() => onRefetch()}
        disabled={isRefetching}
      >
        <RefreshCw size={16} className={isRefetching ? "animate-spin" : ""} />
        Refresh
      </Button>
    </div>
  );
};

export default ProjectFilters;
