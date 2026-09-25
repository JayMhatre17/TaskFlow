#!/usr/bin/env -S node

import type { Contract as End } from "../../snapshots/b54e5e59b8c66ff099c77ca52ab52b0ad21301d57ac64c5079fc45975090c827/contract";
import endContract from "../../snapshots/b54e5e59b8c66ff099c77ca52ab52b0ad21301d57ac64c5079fc45975090c827/contract.json" with { type: "json" };

import type { Contract as Start } from "../../snapshots/f853c90ee22e57395d3338b06af3882ce0f9666732239785ad5d3987cf1923da/contract";
import startContract from "../../snapshots/f853c90ee22e57395d3338b06af3882ce0f9666732239785ad5d3987cf1923da/contract.json" with { type: "json" };

import {
  Migration,
  MigrationCLI,
  rawSql,
} from "@prisma/orm-postgres/migration";

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      rawSql({
        id: "convert-task-priority",
        label: "Convert task priority from string to integer",
        operationClass: "data",
        target: { id: "postgres" },

        precheck: [
          {
            description: "Check priority column is still text",
            sql: `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'task'
        AND column_name = 'priority'
        AND data_type = 'text'
      LIMIT 1
    `,
          },
        ],

        execute: [
          {
            description: "Convert task priority to integer",
            sql: `
              ALTER TABLE "public"."task"
              ALTER COLUMN "priority" TYPE integer
              USING (
                CASE "priority"
                  WHEN 'LOW' THEN 1
                  WHEN 'MEDIUM' THEN 2
                  WHEN 'HIGH' THEN 3
                  WHEN 'URGENT' THEN 4
                END
              )
            `,
          },
        ],

        postcheck: [
          {
            description: "Check priority conversion completed",
            sql: `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'task'
        AND column_name = 'priority'
        AND data_type = 'integer'
      LIMIT 1
    `,
          },
        ],
      }),

      rawSql({
        id: "convert-task-status",
        label: "Convert task status from string to integer",
        operationClass: "data",
        target: { id: "postgres" },

        precheck: [
          {
            description: "Check status column is still text",
            sql: `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'task'
        AND column_name = 'status'
        AND data_type = 'text'
      LIMIT 1
    `,
          },
        ],
        execute: [
          {
            description: "Convert task status to integer",
            sql: `
              ALTER TABLE "public"."task"
              ALTER COLUMN "status" TYPE integer
              USING (
                CASE "status"
                  WHEN 'TODO' THEN 1
                  WHEN 'IN_PROGRESS' THEN 2
                  WHEN 'IN_REVIEW' THEN 3
                  WHEN 'COMPLETED' THEN 4
                END
              )
            `,
          },
        ],

        postcheck: [
          {
            description: "Check status conversion completed",
            sql: `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'task'
        AND column_name = 'status'
        AND data_type = 'integer'
      LIMIT 1
    `,
          },
        ],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
