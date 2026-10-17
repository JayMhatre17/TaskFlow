import { z } from "zod";

export const createTaskCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment cannot exceed 2000 characters"),
});

export const updateTaskCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment cannot exceed 2000 characters"),
});

export type CreateTaskCommentInput = z.infer<typeof createTaskCommentSchema>;

export type UpdateTaskCommentInput = z.infer<typeof updateTaskCommentSchema>;
