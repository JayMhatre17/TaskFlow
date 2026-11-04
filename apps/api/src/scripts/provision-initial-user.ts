import { z } from "zod";
import { db } from "../prisma/db.js";
import { createUser, getUserByEmail } from "../service/auth.service.js";

const inputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  email: z.email().max(254, "Email cannot exceed 254 characters").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),
});

const environmentNames = {
  name: "INITIAL_USER_NAME",
  email: "INITIAL_USER_EMAIL",
  password: "INITIAL_USER_PASSWORD",
} as const;

try {
  const missingVariables = Object.values(environmentNames).filter(
    (variable) => process.env[variable] === undefined,
  );

  if (missingVariables.length > 0) {
    console.error(
      `Missing required environment variable(s): ${missingVariables.join(", ")}.`,
    );
    process.exitCode = 1;
  } else {
    const parsed = inputSchema.safeParse({
      name: process.env[environmentNames.name],
      email: process.env[environmentNames.email],
      password: process.env[environmentNames.password],
    });

    if (!parsed.success) {
      const details = parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      console.error(`Initial user input is invalid: ${details}.`);
      process.exitCode = 1;
    } else {
      const existingUser = await getUserByEmail(parsed.data.email);

      if (existingUser) {
        console.error("A user with this email already exists; no changes were made.");
        process.exitCode = 1;
      } else {
        const user = await createUser(
          parsed.data.name,
          parsed.data.email,
          parsed.data.password,
        );
        console.info(`Initial user created successfully (ID: ${user.id}).`);
      }
    }
  }
} catch {
  console.error(
    "Initial user provisioning failed. Check database connectivity and confirm whether the user was created before retrying.",
  );
  process.exitCode = 1;
} finally {
  try {
    await db.close();
  } catch {
    console.error("The database client could not be closed cleanly.");
    process.exitCode = 1;
  }
}
