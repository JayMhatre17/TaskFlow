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
import { useProjectTasks } from "@/hooks/queries/useProjectTasks";
import { useCurrentUser } from "@/hooks/queries/useAuth";
import ProjectMembersSection from "./ProjectMembersSection";

const ProjectDetails = ({ id }: { id: number }) => {
  const {
    data: project,
    isPending,
    isError,
    error,
    refetch,
  } = useProject(Number(id));
  const currentUserQuery = useCurrentUser();
  const projectTasksQuery = useProjectTasks(id, Boolean(project));
  const tasks = projectTasksQuery.data ?? [];
  const completedTaskCount = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;
  const taskCount = tasks.length;
  const progress =
    taskCount === 0 ? 0 : Math.round((completedTaskCount / taskCount) * 100);

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
    <div className="min-w-0 space-y-6">
      {/* Header */}
      <div className="flex min-w-0 flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="min-w-0 flex-1">
          <div className="mb-2 break-words text-sm text-gray-500">
            Home / Projects / {project.name}
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="min-w-0 break-words text-2xl font-bold text-gray-900">
              {project.name}
            </h1>

            <Badge>{project.status}</Badge>
          </div>

          {project.description && (
            <p className="mt-2 break-words text-sm text-gray-500 [overflow-wrap:anywhere]">
              {project.description}
            </p>
          )}
        </div>

        {currentUserQuery.data?.user.id === project.ownerId && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href={`/team?projectId=${project.id}`}>
              <Button variant="outline" className="cursor-pointer">
                Team
              </Button>
            </Link>
            <Link href={`/projects/${project.id}/edit`}>
              <Button variant="outline" className="cursor-pointer">
                Edit
              </Button>
            </Link>
            <DeleteProjectButton projectId={project.id} projectName={project.name} />
          </div>
        )}
      </div>

      {/* Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 rounded-xl border bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Project Information</h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
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
          </div>
        </div>

        {/* Progress */}
        <div className="min-w-0 rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold">Progress</h2>

          {projectTasksQuery.isPending ? (
            <p className="mt-6 text-sm text-gray-500" role="status">
              Loading task progress...
            </p>
          ) : projectTasksQuery.isError ? (
            <p className="mt-6 text-sm text-gray-500" role="status">
              Task progress is unavailable.
            </p>
          ) : (
            <>
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-gray-500">Completion</span>
                  <span className="font-medium">{progress}%</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-black"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold">{completedTaskCount}</p>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>

                <div>
                  <p className="text-2xl font-bold">{taskCount}</p>
                  <p className="text-sm text-gray-500">Total Tasks</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ProjectMembersSection project={project} />
    </div>
  );
};

export default ProjectDetails;
