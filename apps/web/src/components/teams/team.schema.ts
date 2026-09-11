import z from "zod";

export const teamMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  role: z.enum(["Admin", "Manager", "Developer", "Designer"]),
  status: z.enum(["Active", "Inactive"]),
});

export type TeamMemberFormValues = z.infer<typeof teamMemberSchema>;
