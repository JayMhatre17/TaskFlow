"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";
import { useAddProjectMember } from "@/hooks/mutation/useProjectMemberMutations";
import useProjectOptions from "@/hooks/queries/useProjectOptions";
import { useProjectMemberCandidates } from "@/hooks/queries/useProjectMembers";
import type { ProjectMemberCandidate } from "@/lib/api/project-collaboration.api";
import {
  addProjectMemberSchema,
  type AddProjectMemberFormValues,
} from "./team.schema";

const AddMemberForm = ({ projectId }: { projectId: number }) => {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [selectedCandidate, setSelectedCandidate] =
    useState<ProjectMemberCandidate | null>(null);
  const projectOptionsQuery = useProjectOptions();
  const candidatesQuery = useProjectMemberCandidates(projectId, searchText);
  const addMemberMutation = useAddProjectMember();
  const form = useForm<AddProjectMemberFormValues>({
    resolver: zodResolver(addProjectMemberSchema),

    defaultValues: {
      userId: "",
    },
  });

  const {
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const project = projectOptionsQuery.data?.find(
    (option) => option.id === projectId,
  );

  const onSubmit = async (data: AddProjectMemberFormValues) => {
    try {
      await addMemberMutation.mutateAsync({
        projectId,
        userId: Number(data.userId),
      });
      toast.success("Project member added");
      router.push(`/team?projectId=${projectId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to add project member",
      );
    }
  };

  if (projectOptionsQuery.isPending) {
    return <LoadingState message="Checking project access..." />;
  }

  if (projectOptionsQuery.isError) {
    return (
      <ErrorState
        title="Failed to verify project access"
        description={projectOptionsQuery.error.message}
        onRetry={() => void projectOptionsQuery.refetch()}
      />
    );
  }

  if (!project) {
    return (
      <EmptyState
        iconType="folder"
        title="Project unavailable"
        description="Choose a project you own before adding a member."
      />
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="min-w-0">
          <p className="mb-2 text-sm text-gray-500">
            Add an existing TaskFlow user to <span className="break-words font-medium [overflow-wrap:anywhere]">{project.name}</span>.
          </p>
          <label htmlFor="member-search" className="mb-2 block text-sm font-medium">
            Search users
          </label>
          <Input
            id="member-search"
            type="search"
            placeholder="Search by name or email"
            autoComplete="off"
            maxLength={100}
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setSelectedCandidate(null);
              setValue("userId", "", { shouldValidate: false });
            }}
            aria-describedby="member-search-help"
          />
          <p id="member-search-help" className="mt-1 text-sm text-gray-500">
            Enter at least two characters. Results are limited to eligible users who are not already active project members.
          </p>

          {selectedCandidate ? (
            <div className="mt-3 flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="break-words font-medium [overflow-wrap:anywhere]">{selectedCandidate.name}</p>
                <p className="break-all text-sm text-gray-500">{selectedCandidate.email}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedCandidate(null);
                  setValue("userId", "", { shouldValidate: false });
                }}
              >
                Change
              </Button>
            </div>
          ) : searchText.trim().length < 2 ? (
            <p className="mt-3 text-sm text-gray-500" role="status">
              Search by at least two characters.
            </p>
          ) : candidatesQuery.isPending || candidatesQuery.isFetching ? (
            <div className="mt-3">
              <LoadingState message="Searching users..." />
            </div>
          ) : candidatesQuery.isError ? (
            <div className="mt-3">
              <ErrorState
                title="Failed to search users"
                description={candidatesQuery.error.message}
                onRetry={() => void candidatesQuery.refetch()}
              />
            </div>
          ) : candidatesQuery.data?.users.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                iconType="users"
                title="No eligible users found"
                description="Try another name or email address."
              />
            </div>
          ) : (
            <ul
              className="mt-3 max-h-64 divide-y overflow-y-auto rounded-lg border"
              aria-label="User search results"
            >
              {candidatesQuery.data?.users.map((candidate) => (
                <li key={candidate.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 focus-visible:bg-gray-50"
                    onClick={() => {
                      setSelectedCandidate(candidate);
                      setValue("userId", String(candidate.id), {
                        shouldValidate: true,
                      });
                    }}
                  >
                    <span className="block break-words font-medium [overflow-wrap:anywhere]">{candidate.name}</span>
                    <span className="block break-all text-sm text-gray-500">
                      {candidate.email}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {errors.userId && (
            <p className="mt-1 text-sm text-red-500" role="alert">
              {errors.userId.message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/team?projectId=${projectId}`)}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={
              !selectedCandidate || isSubmitting || addMemberMutation.isPending
            }
          >
            {addMemberMutation.isPending ? "Adding..." : "Add Member"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default AddMemberForm;
