"use client";

import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";
import useProjectOptions from "@/hooks/queries/useProjectOptions";
import CreateTaskForm from "./CreateTaskForm";

const CreateTaskFormWithProjects = () => {
  const { data: projects, isPending, isError, error, refetch } = useProjectOptions();

  if (isPending) {
    return <LoadingState message="Loading projects..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load projects"
        description={error.message}
        onRetry={() => void refetch()}
      />
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        iconType="folder"
        title="No projects available"
        description="Create or join a project before adding a task."
      />
    );
  }

  const projectOptions = projects.map((project) => ({
    label: project.name,
    value: String(project.id),
  }));

  return <CreateTaskForm mode="create" projectOptions={projectOptions} />;
};

export default CreateTaskFormWithProjects;
