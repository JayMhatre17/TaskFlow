"use client";

import { useState } from "react";
import Link from "next/link";
import TeamHeader from "./TeamHeader";
import TeamTable from "./TeamTable";
import ProjectInvitationsPanel from "./ProjectInvitationsPanel";
import useProjectOptions from "@/hooks/queries/useProjectOptions";
import LoadingState from "@/components/states/LoadingState";
import ErrorState from "@/components/states/ErrorState";
import EmptyState from "@/components/states/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TeamContent = ({ initialProjectId }: { initialProjectId?: number }) => {
  const projectsQuery = useProjectOptions();
  const [selectedProjectId, setSelectedProjectId] = useState<
    number | undefined
  >(initialProjectId);

  if (projectsQuery.isPending) {
    return <LoadingState message="Loading your projects..." />;
  }

  if (projectsQuery.isError) {
    return (
      <ErrorState
        title="Failed to load projects"
        description={projectsQuery.error.message}
        onRetry={() => void projectsQuery.refetch()}
      />
    );
  }

  if (projectsQuery.data.length === 0) {
    return (
      <div className="space-y-6">
        <TeamHeader />
        <EmptyState
          iconType="folder"
          title="No projects to manage"
          description="Create a project before managing its members."
          action={
            <Link href="/projects/create">
              <Button>Create Project</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const selectedProject = projectsQuery.data.find(
    (project) => project.id === selectedProjectId,
  ) ?? projectsQuery.data[0];

  return (
    <div className="space-y-6">
      <TeamHeader projectId={selectedProject?.id} />

      <div className="max-w-md space-y-2">
        <label htmlFor="team-project" className="text-sm font-medium">
          Project
        </label>
        <Select
          value={String(selectedProject.id)}
          onValueChange={(value) =>
            setSelectedProjectId(value ? Number(value) : undefined)
          }
        >
          <SelectTrigger id="team-project" className="w-full">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projectsQuery.data.map((project) => (
              <SelectItem key={project.id} value={String(project.id)}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TeamTable projectId={selectedProject.id} canManage />
      <ProjectInvitationsPanel projectId={selectedProject.id} />
    </div>
  );
};

export default TeamContent;
