import { db } from "../prisma/db";

const email = process.env.MASTER_ADMIN_EMAIL?.trim().toLowerCase();

if (!email) {
  console.error("Set MASTER_ADMIN_EMAIL to an existing active user's email.");
  process.exitCode = 1;
} else {
  try {
    const promoted = await db.transaction(async (tx) => {
      const protectedAdmin = await tx.orm.public.User.where({
        role: "ADMIN",
        isProtectedAdmin: true,
      }).first();
      if (protectedAdmin) {
        throw new Error("A protected administrator is already configured.");
      }

      const user = await tx.orm.public.User.where({ email }).first();
      if (!user || user.status !== "ACTIVE") {
        throw new Error("The selected account was not found or is not active.");
      }

      const result = await tx.orm.public.User.where({ id: user.id }).update({
        role: "ADMIN",
        isProtectedAdmin: true,
      });
      if (!result) throw new Error("Administrator setup could not be completed.");
      return result;
    });
    console.info(`Master Admin configured for user ID ${promoted.id}.`);
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Master Admin setup failed.",
    );
    process.exitCode = 1;
  }
}
