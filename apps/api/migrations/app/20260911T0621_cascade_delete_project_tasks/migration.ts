#!/usr/bin/env -S node
import type { Contract as Start } from "../../snapshots/6fee6cec86bc156d9d811db9357107f2f9059c18a3797fe0b6df24fc10e3c515/contract";
import startContract from "../../snapshots/6fee6cec86bc156d9d811db9357107f2f9059c18a3797fe0b6df24fc10e3c515/contract.json" with { type: "json" };
import type { Contract as End } from "../../snapshots/f853c90ee22e57395d3338b06af3882ce0f9666732239785ad5d3987cf1923da/contract";
import endContract from "../../snapshots/f853c90ee22e57395d3338b06af3882ce0f9666732239785ad5d3987cf1923da/contract.json" with { type: "json" };
import { Migration, MigrationCLI } from "@prisma/orm-postgres/migration";

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropConstraint({
        schema: "public",
        table: "task",
        constraint: "task_projectId_fkey",
      }),

      this.addForeignKey({
        schema: "public",
        table: "task",
        foreignKey: {
          name: "task_projectId_fkey",
          columns: ["projectId"],
          references: {
            schema: "public",
            table: "project",
            columns: ["id"],
          },
          onDelete: "cascade",
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
