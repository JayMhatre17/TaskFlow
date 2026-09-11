import { z } from "zod";

export const tskSchema = z
  .object({
    title: z.string().trim().min(1, "Task title is required"),
    description: z.string().optional(),
    projectId: z.string().min(1, "Project is required"),
    status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "COMPLETED"], {
      message: "Invalid task status",
    }),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"], {
      message: "Invalid task priority",
    }),
    dueDate: z.string().min(1, "Due date is required"),
  })
  .refine(
    (data) => {
      if (!data.dueDate) return true;

      return !Number.isNaN(new Date(data.dueDate).getTime());
    },
    {
      message: "Due date must be a valid date",
      path: ["dueDate"],
    },
  );

export type TaskFormValues = z.infer<typeof tskSchema>;
