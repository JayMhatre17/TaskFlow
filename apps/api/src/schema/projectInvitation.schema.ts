import { z } from "zod";

export const createProjectInvitationSchema = z.object({
  email: z.string().trim().email(),
});

export const projectInvitationActionSchema = z.object({
  action: z.enum(["ACCEPT", "REJECT"]),
});
