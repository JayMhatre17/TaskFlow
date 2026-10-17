#!/usr/bin/env -S node
import type { Contract as End } from "../../snapshots/0211fdb89d8c1ec1b516830735cd77f94b722cb4b67e7c9a3a03df521c2c5671/contract";
import endContract from "../../snapshots/0211fdb89d8c1ec1b516830735cd77f94b722cb4b67e7c9a3a03df521c2c5671/contract.json" with { type: "json" };
import type { Contract as Start } from "../../snapshots/27a167ae848be6defdd89d882b4ae7a8dedccbf839f019a465bf5352035a3f49/contract";
import startContract from "../../snapshots/27a167ae848be6defdd89d882b4ae7a8dedccbf839f019a465bf5352035a3f49/contract.json" with { type: "json" };
import { Migration, MigrationCLI } from "@prisma/orm-postgres/migration";

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropCheckConstraint({
        schema: "public",
        table: "notification",
        constraint: "notification_type_check_91734813",
      }),
      this.dropCheckConstraint({
        schema: "public",
        table: "taskActivity",
        constraint: "taskActivity_action_check_e1902285",
      }),
      this.addCheckConstraint({
        schema: "public",
        table: "notification",
        constraint: "notification_type_check_90cbfce4",
        expression:
          "\"type\" IN ('TASK_ASSIGNED', 'TASK_REASSIGNED', 'TASK_UNASSIGNED', 'TASK_STATUS_CHANGED', 'TASK_COMMENTED', 'PROJECT_INVITATION', 'PROJECT_MEMBER_ADDED', 'PROJECT_MEMBER_REMOVED', 'PROJECT_OWNERSHIP_TRANSFERRED', 'ACCOUNT_DEACTIVATED', 'ACCOUNT_DELETION', 'PROJECT_INVITATION_ACCEPTED')",
      }),
      this.addCheckConstraint({
        schema: "public",
        table: "taskActivity",
        constraint: "taskActivity_action_check_35fab25a",
        expression:
          "\"action\" IN ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'DUE_DATE_CHANGED', 'DELETED', 'RESTORED', 'CLOSED', 'REOPENED', 'COMMENT_ADDED', 'COMMENT_UPDATED', 'COMMENT_DELETED')",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
