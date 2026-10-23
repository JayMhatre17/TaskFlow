"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/queries/useAuth";
import { authQueryKeys } from "@/hooks/queries/useAuth";
import useProject from "@/hooks/queries/useProject";
import { ApiError } from "@/lib/api/client";
import { getProjectEditLoginPath } from "@/lib/auth-redirect";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";
import ProjectForm from "./ProjectForm";

const ProjectEditContent = ({ projectId }: { projectId: number }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUser();
  const projectQuery = useProject(projectId);
  const requiresLogin =
    projectQuery.error instanceof ApiError && projectQuery.error.status === 401;

  useEffect(() => {
    if (requiresLogin) {
      void queryClient.resetQueries({
        queryKey: authQueryKeys.currentUser,
        exact: true,
      });
      router.replace(getProjectEditLoginPath(projectId));
    }
  }, [projectId, queryClient, requiresLogin, router]);

  if (requiresLogin) {
    return <LoadingState message="Returning to sign in..." />;
  }

  if (projectQuery.error instanceof ApiError && projectQuery.error.status === 404) {
    return (
      <EmptyState
        iconType="folder"
        title="Project not found"
        description="The project you're looking for could not be found."
      />
    );
  }

  if (projectQuery.isError) {
    const isForbidden =
      projectQuery.error instanceof ApiError && projectQuery.error.status === 403;
    return (
      <ErrorState
        title={isForbidden ? "Project editing is not allowed" : "Failed to load project"}
        description={
          isForbidden
            ? "Only the project owner can edit this project."
            : projectQuery.error.message
        }
        onRetry={() => void projectQuery.refetch()}
      />
    );
  }

  if (
    currentUserQuery.isPending ||
    currentUserQuery.isFetching ||
    projectQuery.isPending
  ) {
    return <LoadingState message="Loading project..." />;
  }

  if (currentUserQuery.isError) {
    return (
      <ErrorState
        title="Unable to verify your session"
        description={currentUserQuery.error.message}
        onRetry={() => void currentUserQuery.refetch()}
      />
    );
  }

  const project = projectQuery.data;
  if (!project) {
    return (
      <EmptyState
        iconType="folder"
        title="Project not found"
        description="The project you're looking for could not be found."
      />
    );
  }

  if (project.ownerId !== currentUserQuery.data.user.id) {
    return (
      <ErrorState
        title="Project editing is not allowed"
        description="Only the project owner can edit this project."
      />
    );
  }

  return (
    <ProjectForm
      mode="edit"
      projectId={project.id}
      defaultValues={{
        name: project.name,
        description: project.description ?? "",
        status: project.status,
        startDate: project.startDate.slice(0, 10),
        dueDate: project.dueDate.slice(0, 10),
      }}
    />
  );
};

export default ProjectEditContent;
