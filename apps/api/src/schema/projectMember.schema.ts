import { z } from "zod";

export const addProjectMemberSchema = z.object({
  userId: z.number().int().positive(),
});

export const searchProjectMemberCandidatesSchema = z.object({
  q: z.string().trim().min(2).max(100),
});
