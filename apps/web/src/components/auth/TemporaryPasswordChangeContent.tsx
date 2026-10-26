"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/queries/useAuth";
import { ApiError } from "@/lib/api/client";
import ChangePasswordSection from "@/components/settings/ChangePasswordSection";
import LoadingState from "@/components/states/LoadingState";
import ErrorState from "@/components/states/ErrorState";

export default function TemporaryPasswordChangeContent() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const unauthenticated = currentUser.error instanceof ApiError && currentUser.error.status === 401;

  useEffect(() => {
    if (unauthenticated) {
      router.replace("/login?returnTo=%2Fchange-password");
    } else if (currentUser.data?.user && !currentUser.data.user.mustChangePassword) {
      router.replace("/dashboard");
    }
  }, [currentUser.data?.user, router, unauthenticated]);

  if (currentUser.isPending || currentUser.isFetching || unauthenticated) {
    return <LoadingState fullHeight message={unauthenticated ? "Redirecting to sign in..." : "Checking your account..."} />;
  }
  if (currentUser.isError) {
    return (
      <ErrorState
        title="Unable to verify your account"
        description="We couldn't verify your session. Try again before changing your password."
        onRetry={() => void currentUser.refetch()}
      />
    );
  }
  if (!currentUser.data?.user.mustChangePassword) {
    return <LoadingState fullHeight message="Returning to your workspace..." />;
  }

  return <ChangePasswordSection forced />;
}
