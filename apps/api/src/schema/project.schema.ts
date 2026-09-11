import { z } from "zod";

export const createProjectSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is Required"),
    description: z.string().optional(),
    status: z.enum(["Active", "On Hold"]),
    startDate: z.iso.date("Start Date must be a valid Date"),
    dueDate: z.iso.date("Due Date must be a valid Date"),
  })
  .refine((data) => new Date(data.dueDate) >= new Date(data.startDate), {
    message: "Due Date must be greater than or equal to Start Date",
    path: ["dueDate"],
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const UpdateProjectSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is Required").optional(),
    description: z.string().optional(),
    status: z.enum(["Active", "On Hold"]).optional(),
    startDate: z.iso.date("Start Date must be a valid Date").optional(),
    dueDate: z.iso.date("Due Date must be a valid Date").optional(),
  })
  .refine(
    (data) =>
      data.startDate === undefined ||
      data.dueDate === undefined ||
      new Date(data.dueDate) >= new Date(data.startDate),
    {
      message: "Due Date must be greater than or equal to Start Date",
      path: ["dueDate"],
    },
  );

export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
