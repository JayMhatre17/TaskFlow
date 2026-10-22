"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import SelectRHF from "../forms/SelectRHF";
import { tskSchema, type TaskFormValues } from "./task.schema";
import { useCreateTask } from "@/hooks/mutation/useCreateTask";
import { useUpdateTask } from "@/hooks/mutation/useUpdateTask";
import { useAssignTask } from "@/hooks/mutation/useAssignTask";
import { useProjectMembers } from "@/hooks/queries/useProjectMembers";
import useProject from "@/hooks/queries/useProject";

type TaskFormProps = {
  mode: "create" | "edit";
  taskId?: number;
  defaultValues?: TaskFormValues;
  projectOptions: {
    label: string;
    value: string;
  }[];
};

const TaskForm = ({
  mode,
  defaultValues,
  taskId,
  projectOptions,
}: TaskFormProps) => {
  const router = useRouter();
  const [createdTaskAssignment, setCreatedTaskAssignment] = useState<{
    taskId: number;
    projectId: number;
    assigneeId: number;
    error: string;
  } | null>(null);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(tskSchema),

    defaultValues: defaultValues ?? {
      title: "",
      description: "",
      projectId: "",
      assigneeId: "",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: "",
    },
  });

  const selectedProjectValue = useWatch({
    control: form.control,
    name: "projectId",
  });
  const selectedProjectId = selectedProjectValue
    ? Number(selectedProjectValue)
    : Number.NaN;
  const hasSelectedProject =
    Number.isSafeInteger(selectedProjectId) && selectedProjectId > 0;
  const projectQuery = useProject(selectedProjectId);
  const membersQuery = useProjectMembers(
    selectedProjectId,
    hasSelectedProject,
  );
  const eligibleAssigneeIds = useMemo(() => {
    const ids = new Set<number>();
    if (projectQuery.data?.ownerId) ids.add(projectQuery.data.ownerId);
    for (const member of membersQuery.data ?? []) ids.add(member.userId);
    return ids;
  }, [membersQuery.data, projectQuery.data]);
  const previousProjectValue = useRef(selectedProjectValue);

  useEffect(() => {
    if (previousProjectValue.current !== selectedProjectValue) {
      previousProjectValue.current = selectedProjectValue;
      form.setValue("assigneeId", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    if (
      mode === "edit" &&
      hasSelectedProject &&
      projectQuery.isSuccess &&
      membersQuery.isSuccess &&
      form.getValues("assigneeId") &&
      !eligibleAssigneeIds.has(Number(form.getValues("assigneeId")))
    ) {
      form.setValue("assigneeId", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [
    eligibleAssigneeIds,
    form,
    hasSelectedProject,
    membersQuery.isSuccess,
    mode,
    projectQuery.isSuccess,
    selectedProjectValue,
  ]);

  const assigneeOptions = [
    { label: "Unassigned", value: "" },
    ...(projectQuery.data
      ? [{ label: "Project owner", value: String(projectQuery.data.ownerId) }]
      : []),
    ...(membersQuery.data ?? [])
      .filter((member) => member.userId !== projectQuery.data?.ownerId)
      .map((member) => ({
        label: member.name
          ? `${member.name}${member.email ? ` (${member.email})` : ""}`
          : member.email ?? `User ${member.userId}`,
        value: String(member.userId),
      })),
  ];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;
  const { mutateAsync: createTask, isPending: isCreating } = useCreateTask();
  const { mutateAsync: updateTask, isPending: isUpdating } = useUpdateTask();
  const assignTaskMutation = useAssignTask();

  const assignmentLoading =
    hasSelectedProject && (projectQuery.isPending || membersQuery.isPending);
  const assignmentError = projectQuery.isError
    ? projectQuery.error
    : membersQuery.isError
      ? membersQuery.error
      : null;

  const retryCreatedAssignment = async () => {
    if (!createdTaskAssignment || assignTaskMutation.isPending) return;

    try {
      await assignTaskMutation.mutateAsync(createdTaskAssignment);
      toast.success("Task created and assigned successfully");
      router.push(`/tasks/${createdTaskAssignment.taskId}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Please try assigning the task again.";
      setCreatedTaskAssignment((current) =>
        current ? { ...current, error: message } : current,
      );
      toast.error(`The task was created, but assignment failed: ${message}`);
    }
  };

  const onSubmit = async (data: TaskFormValues) => {
    const { assigneeId, ...taskFormData } = data;
    const selectedAssigneeId = assigneeId ? Number(assigneeId) : null;
    const originalAssigneeId = defaultValues?.assigneeId ?? "";
    const assignmentChanged =
      mode === "create"
        ? selectedAssigneeId !== null
        : assigneeId !== originalAssigneeId;

    try {
      if (
        assignmentChanged &&
        selectedAssigneeId !== null &&
        (assignmentLoading || assignmentError)
      ) {
        throw new Error("Wait for project assignees to finish loading.");
      }

      if (
        assignmentChanged &&
        selectedAssigneeId !== null &&
        !eligibleAssigneeIds.has(selectedAssigneeId)
      ) {
        throw new Error(
          "Choose the project owner or an active member of the selected project.",
        );
      }

      const payload = {
        ...taskFormData,
        projectId: Number(data.projectId),
      };

      if (mode === "create") {
        const task = await createTask(payload);

        if (selectedAssigneeId !== null) {
          try {
            await assignTaskMutation.mutateAsync({
              taskId: task.id,
              projectId: task.projectId,
              assigneeId: selectedAssigneeId,
            });
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Please try assigning the task again.";
            setCreatedTaskAssignment({
              taskId: task.id,
              projectId: task.projectId,
              assigneeId: selectedAssigneeId,
              error: message,
            });
            toast.error(
              `The task was created, but assignment failed: ${message}. Retry will not create another task.`,
            );
            return;
          }
        }

        toast.success(
          selectedAssigneeId === null
            ? "Task created successfully"
            : "Task created and assigned successfully",
        );

        router.push("/tasks");

        return;
      }

      if (!taskId) {
        throw new Error("Task ID is required");
      }

      const task = await updateTask({ data: payload, id: taskId });

      if (assignmentChanged) {
        try {
          await assignTaskMutation.mutateAsync({
            taskId,
            projectId: payload.projectId,
            assigneeId: selectedAssigneeId,
          });
        } catch (error) {
          toast.error(
            `Task details were saved, but assignment failed: ${error instanceof Error ? error.message : "Please try again."}`,
          );
          return;
        }
      }

      toast.success(
        assignmentChanged
          ? "Task updated and assignment saved successfully"
          : "Task updated successfully",
      );
      router.push(`/tasks/${task.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  if (createdTaskAssignment) {
    return (
      <div className="space-y-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
        <div role="alert" className="space-y-1">
          <p className="font-medium text-amber-950">
            The task was created, but assignment did not complete.
          </p>
          <p className="text-sm text-amber-900">{createdTaskAssignment.error}</p>
          <p className="text-sm text-amber-900">
            Retrying will assign the existing task; it will not create another one.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={assignTaskMutation.isPending}
            onClick={() => router.push(`/tasks/${createdTaskAssignment.taskId}`)}
          >
            Open created task
          </Button>
          <Button
            type="button"
            disabled={assignTaskMutation.isPending}
            onClick={() => void retryCreatedAssignment()}
          >
            {assignTaskMutation.isPending ? "Retrying..." : "Retry assignment"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Task Title */}
        <div>
          <label className="mb-2 block text-sm font-medium">Task Title</label>

          <Input placeholder="Enter task title" {...register("title")} />

          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="mb-2 block text-sm font-medium">Description</label>

          <textarea
            {...register("description")}
            placeholder="Describe the task..."
            className="min-h-28 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />

          {errors.description && (
            <p className="mt-1 text-sm text-red-500">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Project + Priority */}
        <div className="grid gap-6 sm:grid-cols-2">
          <SelectRHF
            name="projectId"
            label="Project"
            placeholder="Select project"
            options={projectOptions ?? []}
            disabled={isSubmitting}
          />

          <SelectRHF
            name="priority"
            label="Priority"
            placeholder="Select priority"
            options={[
              {
                label: "Low",
                value: "LOW",
              },
              {
                label: "Medium",
                value: "MEDIUM",
              },
              {
                label: "High",
                value: "HIGH",
              },
              {
                label: "Urgent",
                value: "URGENT",
              },
            ]}
          />
        </div>

        <div className="max-w-md space-y-2">
          <SelectRHF
            name="assigneeId"
            label="Assignee"
            placeholder="Select an assignee"
            options={assigneeOptions}
            disabled={
              !hasSelectedProject ||
              assignmentLoading ||
              Boolean(assignmentError) ||
              isSubmitting
            }
          />
          {assignmentLoading && (
            <p className="text-sm text-muted-foreground">
              Loading project owner and active members...
            </p>
          )}
          {assignmentError && (
            <div className="space-y-1" role="alert">
              <p className="text-sm text-red-600">
                Could not load eligible assignees: {assignmentError.message}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void projectQuery.refetch();
                  void membersQuery.refetch();
                }}
              >
                Retry loading assignees
              </Button>
            </div>
          )}
          {hasSelectedProject &&
            !assignmentLoading &&
            !assignmentError &&
            membersQuery.isSuccess &&
            membersQuery.data.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Only the project owner is available; there are no active project
                members.
              </p>
            )}
        </div>

        {/* Status + Due Date */}
        <div className="grid gap-6 sm:grid-cols-2">
          <SelectRHF
            name="status"
            label="Status"
            placeholder="Select status"
            options={[
              {
                label: "To Do",
                value: "TODO",
              },
              {
                label: "In Progress",
                value: "IN_PROGRESS",
              },
              {
                label: "In Review",
                value: "IN_REVIEW",
              },
              {
                label: "Completed",
                value: "COMPLETED",
              },
            ]}
          />

          <div>
            <label className="mb-2 block text-sm font-medium">Due Date</label>

            <Input type="date" {...register("dueDate")} />

            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-500">
                {errors.dueDate.message}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={
              isUpdating || isCreating || assignTaskMutation.isPending || isSubmitting
            }
            className="cursor-pointer"
          >
            {mode === "create"
              ? isCreating
                ? "Creating..."
                : "Create Task"
              : isUpdating
                ? "Saving..."
                : "Save Changes"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default TaskForm;
