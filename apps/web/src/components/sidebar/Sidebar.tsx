"use client";

import { cn } from "@/lib/utils";
import {
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
];
type SidebarProps = {
  isMobileOpen: boolean;
  onMobileClose: (v: boolean) => void;
};

const Sidebar = ({ isMobileOpen, onMobileClose }: SidebarProps) => {
  const pathname = usePathname();

  const [isCollapsed, setIsCollapsed] = useState(false);
  useEffect(() => {
    setIsCollapsed(false);
  }, [isMobileOpen]);
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
          "flex h-full w-64 shrink-0 flex-col border-r bg-white transition-all duration-300",
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
            <h1 className="text-xl font-bold text-black">
              {isCollapsed ? "TF" : "TaskFlow"}
            </h1>

            {!isCollapsed && (
              <p className="text-sm text-gray-500">Work Management</p>
            )}
          </div>

          {/* Mobile close */}
          <button
            onClick={() => onMobileClose(false)}
            className="ml-auto rounded-lg p-2 hover:bg-gray-100 lg:hidden cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6">
          {!isCollapsed && (
            <p className="mb-3 px-3 text-xs font-semibold uppercase text-gray-400">
              Workspace
            </p>
          )}

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onMobileClose(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600",
                    "hover:bg-gray-100 hover:text-gray-900",
                    isActive && "bg-gray-100 text-gray-900",
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
              "mt-3 hidden w-full items-center justify-center rounded-lg p-2 text-gray-500 cursor-pointer",
              "hover:bg-gray-100 hover:text-gray-900 lg:flex",
            )}
          >
            {isCollapsed ? (
              <ChevronRight size={19} />
            ) : (
              <ChevronLeft size={19} />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
