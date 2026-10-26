"use client";

import { Menu, Settings } from "lucide-react";
import Link from "next/link";
import Breadcrumbs from "./Breadcrumbs";
import NotificationPopover from "./NotificationPopover";
import UserMenu from "./UserMenuDropDown";

type HeaderProps = {
  onMobileMenuClick: () => void;
};
const Header = ({ onMobileMenuClick }: HeaderProps) => {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      {/* Left */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          onClick={onMobileMenuClick}
          className="cursor-pointer rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <Breadcrumbs />
      </div>

      {/* Right */}
      <div className="flex shrink-0 items-center gap-1">
        <NotificationPopover />

        <Link
          href="/settings"
          className="rounded-lg p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"
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
