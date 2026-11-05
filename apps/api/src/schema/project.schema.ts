import { z } from "zod";
import {
  extractRichTextPlainText,
  normalizeRichTextDocument,
  projectRichTextDocumentSchema,
} from "./rich-text.schema.js";

const projectDescriptionFields = {
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),
  descriptionContent: projectRichTextDocumentSchema.nullable().optional(),
};

const validateDescriptionInput = (
  data: { description?: string; descriptionContent?: unknown },
  context: z.RefinementCtx,
) => {
  if (data.description !== undefined && data.descriptionContent !== undefined) {
    context.addIssue({
      code: "custom",
      path: ["descriptionContent"],
      message: "Send either description or descriptionContent, not both",
    });
  }
};

const projectDescriptionOutput = <T extends { description?: string; descriptionContent?: unknown }>(data: T) => {
  if (data.descriptionContent !== undefined) {
    const descriptionContent = normalizeRichTextDocument(data.descriptionContent, "project");
    const projection = descriptionContent
      ? extractRichTextPlainText(descriptionContent)
      : "";

    return {
      ...data,
      description: projection.trim() ? projection : null,
      descriptionContent,
    };
  }

  if (data.description !== undefined) {
    return {
      ...data,
      description: data.description || null,
      descriptionContent: null,
    };
  }

  return data;
};

export const createProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Project name is required")
      .max(100, "Project name cannot exceed 100 characters"),

    ...projectDescriptionFields,
    status: z.enum(["Active", "On Hold"]),
    startDate: z.iso.date("Start Date must be a valid Date"),
    dueDate: z.iso.date("Due Date must be a valid Date"),
  })
  .superRefine(validateDescriptionInput)
  .refine((data) => data.dueDate >= data.startDate, {
    message: "Due Date must be greater than or equal to Start Date",
    path: ["dueDate"],
  })
  .transform(projectDescriptionOutput);

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const projectDateRangeSchema = z
  .object({
    startDate: z.iso.date("Start Date must be a valid Date"),
    dueDate: z.iso.date("Due Date must be a valid Date"),
  })
  .refine((data) => data.dueDate >= data.startDate, {
    message: "Due Date must be greater than or equal to Start Date",
    path: ["dueDate"],
  });

export const UpdateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Project name is required")
      .max(100, "Project name cannot exceed 100 characters")
      .optional(),

    ...projectDescriptionFields,

    status: z.enum(["Active", "On Hold"]).optional(),

    startDate: z.iso.date("Start Date must be a valid Date").optional(),

    dueDate: z.iso.date("Due Date must be a valid Date").optional(),
  })
  .superRefine(validateDescriptionInput)
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  })
  .transform(projectDescriptionOutput);
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

export const projectQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  search: z
    .string()
    .trim()
    .max(100, "Search cannot exceed 100 characters")
    .optional(),

  status: z.enum(["Active", "On Hold"]).optional(),

  sortBy: z
    .enum(["name", "status", "startDate", "dueDate", "createdAt", "updatedAt"])
    .default("createdAt"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ProjectQueryInput = z.infer<typeof projectQuerySchema>;
