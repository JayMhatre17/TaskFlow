"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/queries/useAuth";
import LoadingState from "@/components/states/LoadingState";
import ErrorState from "@/components/states/ErrorState";

export default function MasterAdminGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const isMasterAdmin = currentUser.data?.user.role === "ADMIN" && currentUser.data.user.isProtectedAdmin;

  useEffect(() => {
    if (currentUser.data?.user && !isMasterAdmin) router.replace("/dashboard");
  }, [currentUser.data?.user, isMasterAdmin, router]);

  if (currentUser.isPending || currentUser.isFetching || (currentUser.data && !isMasterAdmin)) {
    return <LoadingState message="Checking administrator access..." />;
  }
  if (currentUser.isError) {
    return <ErrorState title="Administrator access unavailable" description="We couldn't verify administrator access." onRetry={() => void currentUser.refetch()} />;
  }
  if (!isMasterAdmin) return <LoadingState message="Returning to your workspace..." />;
  return children;
}
