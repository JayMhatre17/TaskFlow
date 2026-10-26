#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/0211fdb89d8c1ec1b516830735cd77f94b722cb4b67e7c9a3a03df521c2c5671/contract';
import startContract from '../../snapshots/0211fdb89d8c1ec1b516830735cd77f94b722cb4b67e7c9a3a03df521c2c5671/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/fee508c88105519ddacaa4d5f10902131d7ac5755d8b21f1f1e5fc2022294a49/contract';
import endContract from '../../snapshots/fee508c88105519ddacaa4d5f10902131d7ac5755d8b21f1f1e5fc2022294a49/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('mustChangePassword', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
