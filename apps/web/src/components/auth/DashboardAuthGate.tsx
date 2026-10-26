"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/queries/useAuth";
import { ApiError } from "@/lib/api/client";
import { getProjectEditLoginPath } from "@/lib/auth-redirect";
import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";

type DashboardAuthGateProps = {
  children: ReactNode;
};

const DashboardAuthGate = ({ children }: DashboardAuthGateProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const currentUserQuery = useCurrentUser();
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isUnauthenticated =
    currentUserQuery.error instanceof ApiError &&
    currentUserQuery.error.status === 401;

  useEffect(() => {
    if (isUnauthenticated) {
      const projectEditMatch = pathname?.match(/^\/projects\/([1-9]\d*)\/edit$/);
      const loginPath = projectEditMatch
        ? getProjectEditLoginPath(Number(projectEditMatch[1]))
        : "/login";
      router.replace(loginPath);
      return;
    }
    if (currentUserQuery.data?.user.mustChangePassword) {
      router.replace("/change-password");
    }
  }, [currentUserQuery.data?.user.mustChangePassword, isUnauthenticated, pathname, router]);

  // Keep the server render and the browser's first render identical. Auth query
  // state is client-owned and can differ after hydration (for example on SPA
  // navigation), so use it only after the client has mounted.
  if (!isHydrated) {
    return <LoadingState fullHeight message="Checking your session..." />;
  }

  if (isUnauthenticated) {
    return <LoadingState fullHeight message="Redirecting to sign in..." />;
  }

  if (currentUserQuery.data?.user.mustChangePassword) {
    return <LoadingState fullHeight message="Redirecting to password setup..." />;
  }

  if (currentUserQuery.isError) {
    return (
      <ErrorState
        title="Unable to verify your session"
        description={currentUserQuery.error.message}
        onRetry={() => void currentUserQuery.refetch()}
      />
    );
  }

  if (
    currentUserQuery.isPending ||
    currentUserQuery.isFetching ||
    !currentUserQuery.data?.user
  ) {
    return <LoadingState fullHeight message="Checking your session..." />;
  }

  return children;
};

export default DashboardAuthGate;
