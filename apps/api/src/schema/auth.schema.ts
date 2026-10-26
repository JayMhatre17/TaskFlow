import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128, "New password cannot exceed 128 characters"),
});

export const adminUserQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100, "Search cannot exceed 100 characters").optional(),
});

export const createAdminUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  email: z.email().max(254, "Email cannot exceed 254 characters").trim().toLowerCase(),
  temporaryPassword: z.string().min(8, "Temporary password must be at least 8 characters").max(128, "Temporary password cannot exceed 128 characters"),
});

export type AdminUserQueryInput = z.infer<typeof adminUserQuerySchema>;
export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
