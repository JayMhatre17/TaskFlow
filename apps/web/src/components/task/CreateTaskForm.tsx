"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import SelectRHF from "../forms/SelectRHF";
import { createTask, updateTask } from "@/lib/api/task.api";
import { tskSchema, type TaskFormValues } from "./task.schema";

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

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(tskSchema),

    defaultValues: defaultValues ?? {
      title: "",
      description: "",
      projectId: "",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (data: TaskFormValues) => {
    try {
      const payload = {
        ...data,
        projectId: Number(data.projectId),
      };

      if (mode === "create") {
        const task = await createTask(payload);

        toast.success("Task created successfully");
        router.push(`/tasks/${task.id}`);

        return;
      }

      if (!taskId) {
        throw new Error("Task ID is required");
      }

      const task = await updateTask(taskId, payload);

      toast.success("Task updated successfully");
      router.push(`/tasks/${task.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  };

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
            disabled={isSubmitting}
            className="cursor-pointer"
          >
            {isSubmitting
              ? mode === "create"
                ? "Creating..."
                : "Saving..."
              : mode === "create"
                ? "Create Task"
                : "Save Changes"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default TaskForm;
