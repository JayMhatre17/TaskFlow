import { z } from "zod";

export const projectSchema = z
  .object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional(),
    status: z.enum(["Active", "On Hold"]),
    startDate: z.string().min(1, "Start date is required"),
    dueDate: z.string().min(1, "Due date is required"),
  })
  .refine(
    (data) => {
      return new Date(data.startDate) < new Date(data.dueDate);
    },
    {
      message: "Due Date cannot be before Start Date",
      path: ["dueDate"],
    },
  );

export type ProjectFormValues = z.infer<typeof projectSchema>;
