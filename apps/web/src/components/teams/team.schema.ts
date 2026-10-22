import z from "zod";

export const addProjectMemberSchema = z.object({
  userId: z
    .string()
    .trim()
    .regex(/^[1-9]\d*$/, "Enter a valid existing user ID"),
});

export const createProjectInvitationSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(254),
});

export type AddProjectMemberFormValues = z.infer<
  typeof addProjectMemberSchema
>;

export type CreateProjectInvitationFormValues = z.infer<
  typeof createProjectInvitationSchema
>;
