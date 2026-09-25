import ProjectsContent from "@/components/projects/ProjectsContent";
import ProjectsHeader from "@/components/projects/ProjectsHeader";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <ProjectsHeader />
      <ProjectsContent />
    </div>
  );
}
