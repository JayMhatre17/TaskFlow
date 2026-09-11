import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";

const UserMenu = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className="flex items-center gap-2 rounded-lg p-1.5 pr-2 hover:bg-gray-100 cursor-pointer"
            aria-label="User menu"
          />
        }
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold">
          J
        </div>

        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium text-gray-900">Jay</p>
          <p className="text-xs text-gray-500">Developer</p>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/profile" className="flex gap-2">
            <User /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          render={
            <Link href="/settings">
              <Settings />
              Settings
            </Link>
          }
        />

        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer">
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
