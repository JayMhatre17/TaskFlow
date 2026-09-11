"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import SelectRHF from "../forms/SelectRHF";
import { createProject, updateProject } from "@/lib/api/project.api";
import { useRouter } from "next/navigation";
import { ProjectFormValues, projectSchema } from "./project.schema";
import { toast } from "sonner";
import { useCreateProject } from "@/hooks/mutation/useCreateProject";
import { useUpdateProject } from "@/hooks/mutation/useUpdateProject";

type ProjectFormProps = {
  mode: "create" | "edit";
  projectId?: number;
  defaultValues?: ProjectFormValues;
};

const ProjectForm = ({ mode, projectId, defaultValues }: ProjectFormProps) => {
  const router = useRouter();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: defaultValues ?? {
      name: "",
      description: "",
      status: "Active",
      startDate: "",
      dueDate: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;
  const { mutateAsync: createProject } = useCreateProject();
  const { mutateAsync: updateProject } = useUpdateProject();

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      if (mode === "create") {
        const project = await createProject(data);
        toast.success("Project created successfully");

        router.push(`/projects/${project?.id}`);
        return;
      }

      if (!projectId) {
        throw new Error("Project ID is required");
      }

      const project = await updateProject({ id: projectId, data });

      toast.success("Project updated successfully");

      router.push(`/projects/${project.id}`);
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
        <div>
          <label className="mb-2 block text-sm font-medium">Project Name</label>

          <Input {...register("name")} />

          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Description</label>

          <textarea
            {...register("description")}
            className="min-h-24 w-full rounded-md border p-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Start Date</label>

          <Input type="date" {...register("startDate")} />

          {errors.startDate && (
            <p className="mt-1 text-sm text-red-500">
              {errors.startDate.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Due Date</label>

          <Input type="date" {...register("dueDate")} />

          {errors.dueDate && (
            <p className="mt-1 text-sm text-red-500">
              {errors.dueDate.message}
            </p>
          )}
        </div>

        <SelectRHF
          name="status"
          label="Status"
          placeholder="Select status"
          options={[
            { label: "Active", value: "Active" },
            { label: "On Hold", value: "On Hold" },
          ]}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
              ? "Create Project"
              : "Save Changes"}
        </Button>
      </form>
    </FormProvider>
  );
};

export default ProjectForm;
