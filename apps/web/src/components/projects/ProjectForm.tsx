"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import SelectRHF from "../forms/SelectRHF";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProjectFormValues, projectSchema } from "./project.schema";
import { toast } from "sonner";
import { useCreateProject } from "@/hooks/mutation/useCreateProject";
import { useUpdateProject } from "@/hooks/mutation/useUpdateProject";
import { ApiError } from "@/lib/api/client";
import { getProjectEditLoginPath } from "@/lib/auth-redirect";
import type { RichTextDocument } from "@/lib/api/rich-text.types";
import RichTextEditor from "@/components/rich-text/RichTextEditor";
import { legacyTextToRichText, sanitizeRichTextDocument } from "@/components/rich-text/rich-text.utils";

type ProjectFormProps = {
  mode: "create" | "edit";
  projectId?: number;
  defaultValues?: ProjectFormValues;
  descriptionContent?: RichTextDocument | null;
};

const ProjectForm = ({ mode, projectId, defaultValues, descriptionContent = null }: ProjectFormProps) => {
  const router = useRouter();
  const [initialRichText] = useState(
    () => {
      const content = descriptionContent ?? legacyTextToRichText(defaultValues?.description);
      return content ? sanitizeRichTextDocument(content) : null;
    },
  );
  const [richTextValue, setRichTextValue] = useState<RichTextDocument | null>(initialRichText);
  const [richTextChanged, setRichTextChanged] = useState(false);

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
    const { description: legacyDescription, ...projectFields } = data;
    void legacyDescription;
    const requestData = richTextChanged
      ? { ...projectFields, descriptionContent: richTextValue }
      : projectFields;

    try {
      if (mode === "create") {
        const project = await createProject(requestData);
        toast.success("Project created successfully");

        router.push(`/projects/${project?.id}`);
        return;
      }

      if (!projectId) {
        throw new Error("Project ID is required");
      }

      const project = await updateProject({ id: projectId, data: requestData });

      toast.success("Project updated successfully");

      router.push(`/projects/${project.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401 && projectId) {
        toast.error("Your session expired. Sign in to continue editing.");
        router.replace(getProjectEditLoginPath(projectId));
        return;
      }
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="min-w-0 w-full space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium">Project Name</label>

          <Input {...register("name")} />

          {errors.name && (
            <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Description</label>
          <RichTextEditor
            initialContent={initialRichText}
            disabled={isSubmitting}
            onChange={(content) => {
              setRichTextChanged(true);
              setRichTextValue(content);
            }}
            label="Project description editor"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Start Date</label>

          <Input type="date" {...register("startDate")} />

          {errors.startDate && (
            <p className="mt-1 text-sm text-destructive">
              {errors.startDate.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Due Date</label>

          <Input type="date" {...register("dueDate")} />

          {errors.dueDate && (
            <p className="mt-1 text-sm text-destructive">
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
