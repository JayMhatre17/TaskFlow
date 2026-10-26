"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useProject from "@/hooks/queries/useProject";
import { useTask } from "@/hooks/queries/useTask";

type Crumb = { label: string; href?: string };

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  tasks: "Tasks",
  team: "Team",
  trash: "Trash",
  profile: "Profile",
  settings: "Settings",
  create: "Create Project",
  new: "New Task",
  edit: "Edit",
};

const Breadcrumbs = () => {
  const pathname = usePathname();
  const projectMatch = pathname.match(/^\/projects\/([1-9]\d*)(?:\/edit)?$/);
  const taskMatch = pathname.match(/^\/tasks\/([1-9]\d*)(?:\/edit)?$/);
  const projectId = projectMatch ? Number(projectMatch[1]) : undefined;
  const taskId = taskMatch ? Number(taskMatch[1]) : undefined;

  const projectQuery = useProject(projectId ?? -1);
  const taskQuery = useTask(taskId ?? -1);

  const crumbs: Crumb[] = [{ label: "Home", href: "/dashboard" }];

  if (projectId !== undefined && projectMatch) {
    crumbs.push({ label: "Projects", href: "/projects" });
    const isEdit = pathname.endsWith("/edit");
    crumbs.push({
      label: projectQuery.data?.name ?? "Project",
      href: isEdit ? `/projects/${projectId}` : undefined,
    });
    if (isEdit) crumbs.push({ label: "Edit Project" });
  } else if (taskId !== undefined && taskMatch) {
    const task = taskQuery.data;
    if (task?.project) {
      crumbs.push({ label: "Projects", href: "/projects" });
      crumbs.push({
        label: task.project.name || "Project",
        href: `/projects/${task.project.id}`,
      });
    } else {
      crumbs.push({ label: "Tasks", href: "/tasks" });
    }

    const isEdit = pathname.endsWith("/edit");
    crumbs.push({
      label: task?.title?.trim() || "Task",
      href: isEdit ? `/tasks/${taskId}` : undefined,
    });
    if (isEdit) crumbs.push({ label: "Edit Task" });
  } else {
    const segments = pathname.split("/").filter(Boolean);
    for (const [index, segment] of segments.entries()) {
      if (/^\d+$/.test(segment)) continue;
      const label =
        (segment === "new"
          ? segments[0] === "team"
            ? "Add Member"
            : "Create Task"
          : routeLabels[segment]) ??
        segment.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      crumbs.push({
        label,
        href: index === segments.length - 1 ? undefined : href,
      });
    }
  }

  return (
    <nav aria-label="Breadcrumb" className="min-w-0 max-w-full overflow-hidden">
      <ol className="flex min-w-0 items-center gap-2 text-sm">
        {crumbs.map((crumb, index) => {
          const isCurrent = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-2">
              {index > 0 && (
                <span aria-hidden="true" className="shrink-0 text-muted-foreground/60">
                  /
                </span>
              )}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  title={crumb.label}
                  className="max-w-48 truncate text-muted-foreground hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isCurrent ? "page" : undefined}
                  title={crumb.label}
                  className="max-w-56 truncate font-medium text-foreground"
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
