"use client";

import { cn } from "@/lib/utils";
import {
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCurrentUser } from "@/hooks/queries/useAuth";

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    label: "Team",
    href: "/team",
    icon: Users,
  },
  {
    label: "Trash",
    href: "/trash",
    icon: Trash2,
  },
];
type SidebarProps = {
  isMobileOpen: boolean;
  onMobileClose: (v: boolean) => void;
};

const Sidebar = ({ isMobileOpen, onMobileClose }: SidebarProps) => {
  const pathname = usePathname();
  const currentUser = useCurrentUser();
  const visibleMenuItems = currentUser.data?.user.role === "ADMIN" && currentUser.data.user.isProtectedAdmin
    ? [...menuItems, { label: "User management", href: "/admin/users", icon: ShieldCheck }]
    : menuItems;

  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden cursor-pointer"
          onClick={() => onMobileClose(false)}
        />
      )}

      <aside
        className={cn(
          "flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
          isCollapsed && "lg:w-20",
          "fixed inset-y-0 left-0 z-50 lg:relative lg:inset-auto lg:z-auto",
          !isMobileOpen && "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo section */}
        <div
          className={cn(
            "flex items-center border-b px-6 py-5",
            isCollapsed && "lg:justify-center lg:px-3",
          )}
        >
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isCollapsed ? "TF" : "TaskFlow"}
            </h1>

            {!isCollapsed && (
              <p className="text-sm text-muted-foreground">Work Management</p>
            )}
          </div>

          {/* Mobile close */}
          <button
            onClick={() => onMobileClose(false)}
            className="ml-auto cursor-pointer rounded-lg p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6">
          {!isCollapsed && (
            <p className="mb-3 px-3 text-xs font-semibold uppercase text-muted-foreground">
              Workspace
            </p>
          )}

          <div className="space-y-1">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onMobileClose(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                    isCollapsed && "lg:justify-center",
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={19} />

                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom section */}
        <div className={cn("border-t p-3 ", isMobileOpen && "hidden")}>
          {/* Collapse button - desktop only */}
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className={cn(
              "mt-3 hidden w-full items-center justify-center rounded-lg p-2 text-muted-foreground cursor-pointer",
              "hover:bg-muted hover:text-foreground lg:flex",
            )}
          >
            {isCollapsed ? (
              <ChevronRight size={19} />
            ) : (
              <ChevronLeft size={19} />
            )}
            <span className="sr-only">{isCollapsed ? "Expand" : "Collapse"} sidebar</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
