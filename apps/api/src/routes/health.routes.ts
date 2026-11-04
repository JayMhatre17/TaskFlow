import { Router } from "express";
import { db } from "../prisma/db.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

router.get("/ready", async (_req, res) => {
  try {
    const plan = db.raw.sql`SELECT 1 AS ready`
      .returnsRow({ ready: "pg/int4@1" })
      .build();
    const rows = await db.runtime().query(plan);

    if (rows.length !== 1 || rows[0]?.ready !== 1) {
      return res.status(503).json({
        status: "error",
        database: "disconnected",
      });
    }

    return res.status(200).json({ status: "ok", database: "connected" });
  } catch {
    return res.status(503).json({
      status: "error",
      database: "disconnected",
    });
  }
});

export default router;
