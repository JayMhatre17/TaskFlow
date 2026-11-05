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
import { useProjectTaskOverview } from "@/hooks/queries/useProjectTaskOverview";
import { useCurrentUser } from "@/hooks/queries/useAuth";
import ProjectMembersSection from "./ProjectMembersSection";
import RichTextRenderer from "@/components/rich-text/RichTextRenderer";
import ProjectTaskOverview from "./ProjectTaskOverview";

const ProjectDetails = ({ id }: { id: number }) => {
  const {
    data: project,
    isPending,
    isError,
    error,
    refetch,
  } = useProject(Number(id));
  const currentUserQuery = useCurrentUser();
  const projectTaskOverviewQuery = useProjectTaskOverview(
    id,
    Boolean(project),
  );
  const taskSummary = projectTaskOverviewQuery.data?.summary;

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
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="min-w-0 break-words text-2xl font-bold text-foreground">
              {project.name}
            </h1>

            <Badge
              className={
                project.status === "Active"
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-warning/30 bg-warning/10 text-warning"
              }
            >
              {project.status}
            </Badge>
          </div>

          {project.descriptionContent ? (
            <div className="mt-2 min-w-0 text-foreground">
              <RichTextRenderer content={project.descriptionContent} label="Project description" />
            </div>
          ) : project.description ? (
            <p className="mt-2 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
              {project.description}
            </p>
          ) : null}
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
        <div className="min-w-0 rounded-xl border bg-card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Project Information</h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="mt-1 font-medium">
                {formatDate(project?.startDate)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="mt-1 font-medium">{formatDate(project?.dueDate)}</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="min-w-0 rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Progress</h2>

          {projectTaskOverviewQuery.isPending ? (
            <p className="mt-6 text-sm text-muted-foreground" role="status">
              Loading task progress...
            </p>
          ) : projectTaskOverviewQuery.isError ? (
            <p className="mt-6 text-sm text-muted-foreground" role="status">
              Task progress is unavailable.
            </p>
          ) : (
            <>
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-medium">
                    {taskSummary?.completionPercentage ?? 0}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${taskSummary?.completionPercentage ?? 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold">
                    {taskSummary?.completedTasks ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>

                <div>
                  <p className="text-2xl font-bold">
                    {taskSummary?.totalTasks ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ProjectTaskOverview
        projectId={project.id}
        data={projectTaskOverviewQuery.data}
        isPending={projectTaskOverviewQuery.isPending}
        error={projectTaskOverviewQuery.isError ? projectTaskOverviewQuery.error : null}
        onRetry={() => void projectTaskOverviewQuery.refetch()}
      />

      <ProjectMembersSection project={project} />
    </div>
  );
};

export default ProjectDetails;
