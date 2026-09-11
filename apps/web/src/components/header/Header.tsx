"use client";

import { Menu, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationPopover from "./NotificationPopover";
import UserMenu from "./UserMenuDropDown";

type HeaderProps = {
  onMobileMenuClick: () => void;
};
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  tasks: "Tasks",
  team: "Team",
  settings: "Settings",
};
const Header = ({ onMobileMenuClick }: HeaderProps) => {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 lg:px-6">
      {/* Left */}
      <div className="flex items-center gap-3 ">
        <button
          onClick={onMobileMenuClick}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden cursor-pointer"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900">
            Home
          </Link>

          {segments.map((segment) => (
            <span key={segment} className="flex items-center gap-2">
              <span className="text-gray-300">/</span>

              <span className="font-medium text-gray-900">
                {routeLabels[segment] ?? segment}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <NotificationPopover />

        <Link
          href="/settings"
          className="rounded-lg p-2.5 text-gray-600 hover:bg-gray-100"
          aria-label="Settings"
        >
          <Settings size={20} />
        </Link>

        <UserMenu />
      </div>
    </header>
  );
};

export default Header;
