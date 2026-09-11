import ProjectFilters from "@/components/projects/ProjectFilters";
import ProjectsContent from "@/components/projects/ProjectsContent";
import ProjectsHeader from "@/components/projects/ProjectsHeader";
import ProjectsPagination from "@/components/projects/ProjectsPagination";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <ProjectsHeader />
      <ProjectFilters />
      <ProjectsContent />
      <ProjectsPagination />
    </div>
  );
}
