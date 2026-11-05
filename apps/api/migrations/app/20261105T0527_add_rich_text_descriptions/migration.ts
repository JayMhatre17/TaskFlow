#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/ee21adc561c0634aefe0916851a14f398bc5776a8db8aec020f84b14607fedf7/contract';
import endContract from '../../snapshots/ee21adc561c0634aefe0916851a14f398bc5776a8db8aec020f84b14607fedf7/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/fee508c88105519ddacaa4d5f10902131d7ac5755d8b21f1f1e5fc2022294a49/contract';
import startContract from '../../snapshots/fee508c88105519ddacaa4d5f10902131d7ac5755d8b21f1f1e5fc2022294a49/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'project',
        column: col('descriptionContent', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'task',
        column: col('descriptionContent', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
