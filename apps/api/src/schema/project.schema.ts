import { z } from "zod";

export const createProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Project name is required")
      .max(100, "Project name cannot exceed 100 characters"),

    description: z
      .string()
      .trim()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional(),
    status: z.enum(["Active", "On Hold"]),
    startDate: z.iso.date("Start Date must be a valid Date"),
    dueDate: z.iso.date("Due Date must be a valid Date"),
  })
  .refine((data) => data.dueDate >= data.startDate, {
    message: "Due Date must be greater than or equal to Start Date",
    path: ["dueDate"],
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const UpdateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Project name is required")
      .max(100, "Project name cannot exceed 100 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional(),

    status: z.enum(["Active", "On Hold"]).optional(),

    startDate: z.iso.date("Start Date must be a valid Date").optional(),

    dueDate: z.iso.date("Due Date must be a valid Date").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });
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
