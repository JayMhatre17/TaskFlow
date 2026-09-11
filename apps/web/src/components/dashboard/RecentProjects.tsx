import Link from "next/link";
import { Badge } from "../ui/badge";

type Project = {
  id: number;
  name: string;
  description: string;
  status: "Active" | "Completed";
  taskCount: number;
  updatedAt: string;
};

const projects: Project[] = [
  {
    id: 1,
    name: "TaskFlow Website",
    description: "Build the new TaskFlow website",
    status: "Active",
    taskCount: 8,
    updatedAt: "2 hours ago",
  },
  {
    id: 2,
    name: "Mobile App",
    description: "TaskFlow mobile application",
    status: "Completed",
    taskCount: 15,
    updatedAt: "Yesterday",
  },
  {
    id: 3,
    name: "Marketing Website",
    description: "Marketing website redesign",
    status: "Active",
    taskCount: 6,
    updatedAt: "3 days ago",
  },
];
const RecentProjects = () => {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Recent Projects</h2>

          <p className="mt-1 text-sm text-gray-500">
            Recently updated projects in your workspace.
          </p>
        </div>

        <Link
          href="/projects"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          View all
        </Link>
      </div>

      <div className="mt-6 divide-y">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="block py-4 first:pt-0 last:pb-0 hover:bg-gray-50"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-medium text-gray-900">{project.name}</h3>

                <p className="mt-1 text-sm text-gray-500">
                  {project.description}
                </p>

                <p className="mt-2 text-xs text-gray-400">
                  {project.taskCount} tasks · Updated {project.updatedAt}
                </p>
              </div>

              <Badge
                variant={project.status === "Active" ? "default" : "secondary"}
              >
                {project.status}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecentProjects;
