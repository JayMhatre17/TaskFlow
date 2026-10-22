import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { assertTestDatabaseConfiguration } from "./test-database-guard";

if (process.env.NODE_ENV !== "test") {
  throw new Error('Test setup requires NODE_ENV to be exactly "test".');
}

dotenv.config({
  path: fileURLToPath(new URL("../.env.test", import.meta.url)),
});

assertTestDatabaseConfiguration(process.env);
