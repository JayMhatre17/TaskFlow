import dotenv from "dotenv";
import { Temporal } from "@js-temporal/polyfill";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "./contract.d.js";
import contractJson from "./contract.json" with { type: "json" };

type TemporalGlobal = typeof globalThis & { Temporal?: typeof Temporal };
const temporalGlobal = globalThis as TemporalGlobal;
temporalGlobal.Temporal ??= Temporal;

if (process.env.NODE_ENV !== "test") {
  dotenv.config({
    path: ".env",
  });
}
export const db = postgres<Contract>({
  contractJson,
  url: process.env["DATABASE_URL"]!,
});
