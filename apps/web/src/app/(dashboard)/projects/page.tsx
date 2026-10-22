import { Suspense } from "react";
import LoadingState from "@/components/states/LoadingState";
import ProjectsContent from "@/components/projects/ProjectsContent";
import ProjectsHeader from "@/components/projects/ProjectsHeader";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <ProjectsHeader />
      <Suspense fallback={<LoadingState message="Loading projects..." />}>
        <ProjectsContent />
      </Suspense>
    </div>
  );
}
