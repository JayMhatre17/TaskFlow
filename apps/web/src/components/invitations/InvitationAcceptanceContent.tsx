"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { getDistinctUserEmail } from "@/lib/user-display";
import {
  acceptProjectInvitation,
  rejectProjectInvitation,
} from "@/lib/api/project-collaboration.api";
import { authQueryKeys, useCurrentUser } from "@/hooks/queries/useAuth";
import {
  getInvitationAcceptancePath,
  getInvitationLoginPath,
} from "@/lib/auth-redirect";
import LoadingState from "@/components/states/LoadingState";
import ErrorState from "@/components/states/ErrorState";
import { Button } from "@/components/ui/button";

const INVITATION_TOKEN_PATTERN = /^[a-f0-9]{64}$/;

type ActionError = {
  title: string;
  description: string;
  retryable: boolean;
};

const getActionError = (error: unknown): ActionError => {
  if (!(error instanceof ApiError)) {
    return {
      title: "Unable to respond to invitation",
      description: "TaskFlow could not complete the request. Please try again.",
      retryable: true,
    };
  }

  if (error.status === 403) {
    return {
      title: "Invitation is for another account",
      description:
        "Sign in with the account that received this invitation. The invitation cannot be accepted or declined by this account.",
      retryable: false,
    };
  }

  if (error.status === 404) {
    return {
      title: "Invitation not found",
      description: "This invitation link is invalid or no longer available.",
      retryable: false,
    };
  }

  if (error.status === 410) {
    return {
      title: "Invitation expired",
      description: "This invitation has expired. Ask the project owner for a new invitation.",
      retryable: false,
    };
  }

  if (error.status === 409) {
    return {
      title: "Invitation already handled",
      description:
        "This invitation is no longer pending or your account already has project access.",
      retryable: false,
    };
  }

  if (error.status >= 500) {
    const isNetworkError = /network|timeout|econn|err_network/i.test(
      error.message,
    );
    return {
      title: isNetworkError
        ? "Unable to reach TaskFlow"
        : "TaskFlow is temporarily unavailable",
      description: isNetworkError
        ? "Check your connection and try the invitation again."
        : "The server could not complete this request. Please try again in a moment.",
      retryable: true,
    };
  }

  return {
    title: "Unable to respond to invitation",
    description: "The invitation request could not be completed.",
    retryable: false,
  };
};

const InvitationAcceptanceContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUser();
  const submissionInProgress = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<ActionError | null>(null);
  const [completedAction, setCompletedAction] = useState<
    "ACCEPT" | "REJECT" | null
  >(null);
  const tokens = searchParams.getAll("token");
  const token = tokens.length === 1 ? tokens[0] : null;
  const hasValidToken = Boolean(token && INVITATION_TOKEN_PATTERN.test(token));
  const isUnauthenticated =
    currentUserQuery.error instanceof ApiError &&
    currentUserQuery.error.status === 401;

  useEffect(() => {
    if (isUnauthenticated && hasValidToken && token) {
      const returnTo = getInvitationAcceptancePath(token);
      router.replace(getInvitationLoginPath(returnTo));
    }
  }, [hasValidToken, isUnauthenticated, router, token]);

  const respond = async (action: "ACCEPT" | "REJECT") => {
    if (!token || !hasValidToken || submissionInProgress.current) return;

    submissionInProgress.current = true;
    setIsSubmitting(true);
    setActionError(null);

    try {
      if (action === "ACCEPT") {
        const result = await acceptProjectInvitation(token);
        const projectId = result.invitation.projectId;
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["projects"] }),
          queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
          queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
          queryClient.invalidateQueries({
            queryKey: ["project-members", projectId],
          }),
        ]);
        router.replace(`/projects/${projectId}`);
        return;
      }

      await rejectProjectInvitation(token);
      setCompletedAction("REJECT");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await queryClient.invalidateQueries({
          queryKey: authQueryKeys.currentUser,
        });
        router.replace(
          getInvitationLoginPath(getInvitationAcceptancePath(token)),
        );
        return;
      }
      setActionError(getActionError(error));
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  };

  if (!hasValidToken) {
    return (
      <ErrorState
        title="Invalid invitation link"
        description="This invitation link is incomplete or malformed. Ask the project owner for a new link."
      />
    );
  }

  if (isUnauthenticated) {
    return <LoadingState message="Redirecting to sign in..." />;
  }

  if (currentUserQuery.isError) {
    return (
      <ErrorState
        title="Unable to verify your account"
        description="TaskFlow could not check your session. Try again before responding to this invitation."
        onRetry={() => void currentUserQuery.refetch()}
      />
    );
  }

  if (
    currentUserQuery.isPending ||
    currentUserQuery.isFetching ||
    !currentUserQuery.data?.user
  ) {
    return <LoadingState message="Checking your account..." />;
  }

  if (completedAction === "REJECT") {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-semibold text-gray-900">
          Invitation declined
        </h1>
        <p className="text-sm text-gray-600">
          You declined this project invitation.
        </p>
        <Button type="button" onClick={() => router.replace("/dashboard")}>
          Continue to TaskFlow
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Project invitation
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          You are signed in as{" "}
          <span className="font-medium">{currentUserQuery.data.user.name}</span>
          {getDistinctUserEmail(
            currentUserQuery.data.user.email,
            currentUserQuery.data.user.name,
          ) && <span>{` (${currentUserQuery.data.user.email})`}</span>}.
          Accepting this invitation will add this account to the project. The
          server will verify that the invitation belongs to this account and is
          still valid.
        </p>
      </div>

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="font-medium text-red-800" role="alert">
            {actionError.title}
          </p>
          <p className="mt-1 text-sm text-red-700">{actionError.description}</p>
          {actionError.retryable && (
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() => setActionError(null)}
            >
              Dismiss
            </Button>
          )}
        </div>
      )}

      {actionError?.retryable ? null : actionError ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => router.replace("/dashboard")}
        >
          Back to TaskFlow
        </Button>
      ) : (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => void respond("REJECT")}
          >
            {isSubmitting ? "Please wait..." : "Decline invitation"}
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => void respond("ACCEPT")}
          >
            {isSubmitting ? "Please wait..." : "Accept invitation"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default InvitationAcceptanceContent;
