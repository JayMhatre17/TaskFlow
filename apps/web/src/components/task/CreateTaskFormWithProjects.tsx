"use client";

import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";
import useProjectOptions from "@/hooks/queries/useProjectOptions";
import CreateTaskForm from "./CreateTaskForm";

const CreateTaskFormWithProjects = ({
  initialProjectId,
}: {
  initialProjectId?: number;
}) => {
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

  const selectedProjectId = projectOptions.some(
    (project) => project.value === String(initialProjectId),
  )
    ? initialProjectId
    : undefined;

  return (
    <CreateTaskForm
      mode="create"
      projectOptions={projectOptions}
      initialProjectId={selectedProjectId}
    />
  );
};

export default CreateTaskFormWithProjects;
