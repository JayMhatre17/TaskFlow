"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/queries/useAuth";
import { ApiError } from "@/lib/api/client";
import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";

type DashboardAuthGateProps = {
  children: ReactNode;
};

const DashboardAuthGate = ({ children }: DashboardAuthGateProps) => {
  const router = useRouter();
  const currentUserQuery = useCurrentUser();
  const isUnauthenticated =
    currentUserQuery.error instanceof ApiError &&
    currentUserQuery.error.status === 401;

  useEffect(() => {
    if (isUnauthenticated) {
      router.replace("/login");
    }
  }, [isUnauthenticated, router]);

  if (isUnauthenticated) {
    return <LoadingState fullHeight message="Redirecting to sign in..." />;
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
