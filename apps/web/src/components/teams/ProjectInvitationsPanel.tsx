"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCancelProjectInvitation, useCreateProjectInvitation } from "@/hooks/mutation/useProjectInvitationMutations";
import { useProjectInvitations } from "@/hooks/queries/useProjectInvitations";
import {
  createProjectInvitationSchema,
  type CreateProjectInvitationFormValues,
} from "./team.schema";

const ProjectInvitationsPanel = ({ projectId }: { projectId: number }) => {
  const invitationsQuery = useProjectInvitations(projectId);
  const createInvitationMutation = useCreateProjectInvitation();
  const cancelInvitationMutation = useCancelProjectInvitation();
  const [shareLink, setShareLink] = useState<string | null>(null);
  const form = useForm<CreateProjectInvitationFormValues>({
    resolver: zodResolver(createProjectInvitationSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }: CreateProjectInvitationFormValues) => {
    try {
      const result = await createInvitationMutation.mutateAsync({
        projectId,
        email,
      });
      const invitationUrl = new URL(
        "/invitations/accept",
        window.location.origin,
      );
      invitationUrl.searchParams.set("token", result.token);
      setShareLink(invitationUrl.toString());
      form.reset();
      createInvitationMutation.reset();
      toast.success("Invitation created. Share the link with the recipient.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create invitation",
      );
    }
  };

  const copyShareLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("Invitation link copied");
    } catch {
      toast.error("Unable to copy the invitation link");
    }
  };

  return (
    <section className="min-w-0 space-y-5 rounded-xl border bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Pending invitations
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Create a shareable link for an existing or future TaskFlow user. Invitations expire after seven days.
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3 sm:flex-row sm:items-start"
        noValidate
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="invitation-email" className="sr-only">
            Recipient email
          </label>
          <Input
            id="invitation-email"
            type="email"
            autoComplete="email"
            maxLength={254}
            placeholder="name@example.com"
            aria-invalid={Boolean(form.formState.errors.email)}
            aria-describedby={
              form.formState.errors.email ? "invitation-email-error" : undefined
            }
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p
              id="invitation-email-error"
              className="mt-1 text-sm text-red-500"
              role="alert"
            >
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          disabled={
            createInvitationMutation.isPending || form.formState.isSubmitting
          }
        >
          {createInvitationMutation.isPending ? "Creating..." : "Create invitation"}
        </Button>
      </form>

      {shareLink && (
        <div className="space-y-2 rounded-lg border bg-gray-50 p-3">
          <label htmlFor="invitation-link" className="text-sm font-medium">
            Shareable invitation link
          </label>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
            <Input id="invitation-link" className="min-w-0 flex-1" readOnly value={shareLink} />
            <Button type="button" variant="outline" onClick={copyShareLink} className="shrink-0">
              Copy
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Recipients will be asked to sign in before they can accept or decline.
          </p>
        </div>
      )}

      {invitationsQuery.isPending ? (
        <LoadingState message="Loading invitations..." />
      ) : invitationsQuery.isError ? (
        <ErrorState
          title="Failed to load invitations"
          description={invitationsQuery.error.message}
          onRetry={() => void invitationsQuery.refetch()}
        />
      ) : invitationsQuery.data.invitations.length === 0 ? (
        <EmptyState
          iconType="inbox"
          title="No pending invitations"
          description="Invitations you create for this project will appear here."
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {invitationsQuery.data.invitations.map((invitation) => {
            const isCancelling =
              cancelInvitationMutation.isPending &&
              cancelInvitationMutation.variables?.invitationId ===
                invitation.id;

            return (
              <li
                key={invitation.id}
                className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="break-all font-medium">{invitation.email}</p>
                  <p className="text-sm text-gray-500">
                    Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={cancelInvitationMutation.isPending}
                  onClick={() =>
                    cancelInvitationMutation.mutate(
                      { projectId, invitationId: invitation.id },
                      {
                        onSuccess: () =>
                          toast.success("Invitation cancelled"),
                        onError: (error) =>
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : "Unable to cancel invitation",
                          ),
                      },
                    )
                  }
                >
                  {isCancelling ? "Cancelling..." : "Cancel invitation"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default ProjectInvitationsPanel;
