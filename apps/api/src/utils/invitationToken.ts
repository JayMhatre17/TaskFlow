import { randomBytes, createHash } from "node:crypto";

export const generateInvitaionToken = () => {
  const token = randomBytes(32).toString("hex");

  const tokenHash = createHash("sha256").update(token).digest("hex");

  return {
    token,
    tokenHash,
  };
};
