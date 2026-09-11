"use client";

import { useProjects } from "@/hooks/queries/useProjects";

import ProjectsTable from "./ProjectsTable";
import EmptyState from "../states/EmptyState";
import ErrorState from "../states/ErrorState";
import LoadingState from "../states/LoadingState";

const ProjectsContent = () => {
  const { data: projects, isPending, isError, error, refetch } = useProjects();

  if (isPending) {
    return <LoadingState message="Loading projects..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load projects"
        description={error.message}
        onRetry={() => refetch()}
      />
    );
  }

  if (projects?.length === 0) {
    return (
      <EmptyState
        iconType="folder"
        title="No projects found"
        description="Create your first project to get started."
      />
    );
  }

  return <ProjectsTable projects={projects} />;
};

export default ProjectsContent;
