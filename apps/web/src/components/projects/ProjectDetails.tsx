"use client";

import EmptyState from "../states/EmptyState";
import ErrorState from "../states/ErrorState";
import LoadingState from "../states/LoadingState";
import useProject from "@/hooks/queries/useProject";
import { Button } from "../ui/button";
import Link from "next/link";
import DeleteProjectButton from "./DeleteProjectButton";
import { Badge } from "../ui/badge";
import { formatDate } from "@/lib/basicFn";

const ProjectDetails = ({ id }: { id: number }) => {
  const {
    data: project,
    isPending,
    isError,
    error,
    refetch,
  } = useProject(Number(id));

  if (isPending) {
    return <LoadingState message="Loading project..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load project"
        description={error.message}
        onRetry={() => refetch()}
      />
    );
  }

  if (!project) {
    return (
      <EmptyState
        iconType="folder"
        title="Project not found"
        description="The project you're looking for could not be found."
      />
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 text-sm text-gray-500">
            Home / Projects / {project?.name}
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {project?.name}
            </h1>

            <Badge>{project?.status}</Badge>
          </div>

          <p className="mt-2 text-sm text-gray-500">{project?.description}</p>
        </div>

        <div className="flex gap-2">
          <Link href={`/projects/${project?.id}/edit`}>
            <Button variant="outline" className="cursor-pointer">
              Edit
            </Button>
          </Link>
          <DeleteProjectButton projectId={project?.id} />
        </div>
      </div>

      {/* Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Project Information</h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="mt-1 font-medium">
                {formatDate(project?.startDate)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="mt-1 font-medium">{formatDate(project?.dueDate)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Manager</p>
              <p className="mt-1 font-medium">{project?.manager}</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold">Progress</h2>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-gray-500">Completion</span>
              <span className="font-medium">{project?.progress}%</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-black"
                style={{ width: `${project?.progress}%` }}
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">{project?.tasks?.completed}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>

            <div>
              <p className="text-2xl font-bold">{project?.tasks?.total}</p>
              <p className="text-sm text-gray-500">Total Tasks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
