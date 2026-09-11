import z from "zod";
export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Task Title is Required"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "COMPLETED"], {
    message: "Invalid task status",
  }),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"], {
    message: "Invalid task priority",
  }),
  dueDate: z.iso.date("Due date must be a valid date").optional(),
  projectId: z.number().int().positive("Project ID must be a positive integer"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").optional(),

  description: z.string().optional(),

  status: z
    .enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "COMPLETED"], {
      message: "Invalid task status",
    })
    .optional(),

  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT"], {
      message: "Invalid task priority",
    })
    .optional(),

  dueDate: z.iso.date("Due date must be a valid date").optional(),

  projectId: z
    .number()
    .int()
    .positive("Project ID must be a positive integer")
    .optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
