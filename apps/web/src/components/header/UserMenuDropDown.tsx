"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Loader2, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentUser, useLogout } from "@/hooks/queries/useAuth";
import { ApiError } from "@/lib/api/client";

const UserMenu = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUser();
  const logoutMutation = useLogout();
  const user = currentUserQuery.data?.user;
  const isLoading = currentUserQuery.isPending;
  const isUnauthenticated =
    currentUserQuery.error instanceof ApiError &&
    currentUserQuery.error.status === 401;
  const initials = user
    ? user.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : isLoading
      ? ""
      : "?";

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      queryClient.clear();
      router.replace("/login");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to log out. Please try again.",
      );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className="flex min-w-0 items-center gap-2 rounded-lg p-1.5 pr-2 hover:bg-gray-100 cursor-pointer"
            aria-label="User menu"
            disabled={isLoading || logoutMutation.isPending}
          />
        }
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold">
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : initials}
        </div>

        <div className="hidden min-w-32 text-left sm:block">
          <p className="max-w-40 truncate text-sm font-medium text-gray-900">
            {user?.name ??
              (isLoading
                ? "Loading account..."
                : isUnauthenticated
                  ? "Signed out"
                  : "Account unavailable")}
          </p>
          <p className="max-w-40 truncate text-xs text-gray-500">
            {user?.email ??
              (isLoading
                ? " "
                : isUnauthenticated
                  ? "Sign in to continue"
                  : "Retry account lookup")}
          </p>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        {user ? (
          <>
            <DropdownMenuItem className="cursor-pointer">
              <Link href="/profile" className="flex w-full items-center gap-2">
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

            <DropdownMenuItem
              className="cursor-pointer"
              disabled={logoutMutation.isPending}
              onClick={() => void handleLogout()}
            >
              {logoutMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <LogOut />
              )}
              {logoutMutation.isPending ? "Logging out..." : "Log out"}
            </DropdownMenuItem>
          </>
        ) : isUnauthenticated ? (
          <DropdownMenuItem
            className="cursor-pointer"
            render={
              <Link href="/login">
                <User />
                Sign in
              </Link>
            }
          />
        ) : (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => void currentUserQuery.refetch()}
          >
            Retry account lookup
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
