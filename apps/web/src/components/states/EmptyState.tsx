import {
  FileQuestion,
  FolderOpen,
  Inbox,
  Search,
  Users,
  ClipboardList,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateIcon =
  | "default"
  | "search"
  | "folder"
  | "file"
  | "users"
  | "tasks"
  | "inbox";

type EmptyStateProps = {
  icon?: ReactNode;
  iconType?: EmptyStateIcon;
  title?: string;
  description?: string;
  action?: ReactNode;
};

const iconMap: Record<EmptyStateIcon, LucideIcon> = {
  default: Inbox,
  search: Search,
  folder: FolderOpen,
  file: FileQuestion,
  users: Users,
  tasks: ClipboardList,
  inbox: Inbox,
};

const EmptyState = ({
  icon,
  iconType = "default",
  title = "No data found",
  description = "There is nothing to display here yet.",
  action,
}: EmptyStateProps) => {
  const Icon = iconMap[iconType];

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon ?? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Icon size={24} />
        </div>
      )}

      <h3 className="text-base font-semibold text-gray-900">{title}</h3>

      <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
