#!/usr/bin/env -S node
import type { Contract as Start } from "../../snapshots/1d472adaa9639b882fee14aff486b6cbd52dbf3adcc896218aaee163f704d5ed/contract";
import startContract from "../../snapshots/1d472adaa9639b882fee14aff486b6cbd52dbf3adcc896218aaee163f704d5ed/contract.json" with { type: "json" };
import type { Contract as End } from "../../snapshots/27a167ae848be6defdd89d882b4ae7a8dedccbf839f019a465bf5352035a3f49/contract";
import endContract from "../../snapshots/27a167ae848be6defdd89d882b4ae7a8dedccbf839f019a465bf5352035a3f49/contract.json" with { type: "json" };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  placeholder,
  primaryKey,
} from "@prisma/orm-postgres/migration";
import postgres from "@prisma/orm-postgres/runtime";

const { sql: db, contract } = postgres<End>({
  contractJson: endContract,
});

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: "public",
        table: "accountActivity",
        columns: [
          col("action", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("actorId", "int4", { codecRef: { codecId: "pg/int4@1" } }),
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("description", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("id", "SERIAL", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("newValue", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("oldValue", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("userId", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
        ],
        constraints: [
          primaryKey(["id"]),
          checkExpression(
            "accountActivity_action_check_e2b8a814",
            "\"action\" IN ('CREATED', 'DEACTIVATED', 'REACTIVATED', 'DELETION_REQUESTED', 'DELETION_CANCELLED', 'DELETED', 'ROLE_CHANGED')",
          ),
        ],
      }),
      this.createTable({
        schema: "public",
        table: "notification",
        columns: [
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("id", "SERIAL", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("isRead", "bool", {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: "pg/bool@1" },
          }),
          col("message", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("projectId", "int4", { codecRef: { codecId: "pg/int4@1" } }),
          col("readAt", "timestamptz", {
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("taskId", "int4", { codecRef: { codecId: "pg/int4@1" } }),
          col("title", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("type", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("userId", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
        ],
        constraints: [
          primaryKey(["id"]),
          checkExpression(
            "notification_type_check_91734813",
            "\"type\" IN ('TASK_ASSIGNED', 'TASK_REASSIGNED', 'TASK_UNASSIGNED', 'TASK_STATUS_CHANGED', 'TASK_COMMENTED', 'PROJECT_INVITATION', 'PROJECT_MEMBER_ADDED', 'PROJECT_MEMBER_REMOVED', 'PROJECT_OWNERSHIP_TRANSFERRED', 'ACCOUNT_DEACTIVATED', 'ACCOUNT_DELETION')",
          ),
        ],
      }),
      this.createTable({
        schema: "public",
        table: "projectActivity",
        columns: [
          col("action", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("actorId", "int4", { codecRef: { codecId: "pg/int4@1" } }),
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("description", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("field", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("id", "SERIAL", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("newValue", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("oldValue", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("projectId", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
        ],
        constraints: [
          primaryKey(["id"]),
          checkExpression(
            "projectActivity_action_check_cafd66cb",
            "\"action\" IN ('CREATED', 'UPDATED', 'OWNER_CHANGED', 'DELETED', 'RESTORED')",
          ),
        ],
      }),
      this.createTable({
        schema: "public",
        table: "projectInvitation",
        columns: [
          col("acceptedAt", "timestamptz", {
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("cancelledAt", "timestamptz", {
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("email", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("expiresAt", "timestamptz", {
            notNull: true,
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("id", "SERIAL", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("projectId", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("recipientId", "int4", { codecRef: { codecId: "pg/int4@1" } }),
          col("rejectedAt", "timestamptz", {
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("senderId", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("status", "text", {
            notNull: true,
            default: lit("PENDING"),
            codecRef: { codecId: "pg/text@1" },
          }),
          col("tokenHash", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("updatedAt", "timestamptz", {
            notNull: true,
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
        ],
        constraints: [
          primaryKey(["id"]),
          checkExpression(
            "projectInvitation_status_check_d85c7349",
            "\"status\" IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED')",
          ),
        ],
      }),
      this.createTable({
        schema: "public",
        table: "projectMember",
        columns: [
          col("addedById", "int4", { codecRef: { codecId: "pg/int4@1" } }),
          col("id", "SERIAL", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("joinedAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("projectId", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("removedAt", "timestamptz", {
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("userId", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
        ],
        constraints: [primaryKey(["id"])],
      }),
      this.createTable({
        schema: "public",
        table: "projectMembershipHistory",
        columns: [
          col("action", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("id", "SERIAL", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("performedById", "int4", { codecRef: { codecId: "pg/int4@1" } }),
          col("projectId", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("userId", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
        ],
        constraints: [
          primaryKey(["id"]),
          checkExpression(
            "projectMembershipHistory_action_check_b5bef4b5",
            "\"action\" IN ('JOINED', 'REMOVED', 'REJOINED')",
          ),
        ],
      }),
      this.createTable({
        schema: "public",
        table: "taskActivity",
        columns: [
          col("action", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("actorId", "int4", { codecRef: { codecId: "pg/int4@1" } }),
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("description", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("field", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("id", "SERIAL", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("newValue", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("oldValue", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("taskId", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
        ],
        constraints: [
          primaryKey(["id"]),
          checkExpression(
            "taskActivity_action_check_e1902285",
            "\"action\" IN ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'DUE_DATE_CHANGED', 'DELETED', 'RESTORED', 'CLOSED', 'REOPENED')",
          ),
        ],
      }),
      this.createTable({
        schema: "public",
        table: "taskAssignmentHistory",
        columns: [
          col("action", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("id", "SERIAL", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("newAssigneeId", "int4", { codecRef: { codecId: "pg/int4@1" } }),
          col("performedById", "int4", { codecRef: { codecId: "pg/int4@1" } }),
          col("previousAssigneeId", "int4", {
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("reason", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("taskId", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
        ],
        constraints: [
          primaryKey(["id"]),
          checkExpression(
            "taskAssignmentHistory_action_check_6e332bb8",
            "\"action\" IN ('ASSIGNED', 'REASSIGNED', 'UNASSIGNED')",
          ),
        ],
      }),
      this.createTable({
        schema: "public",
        table: "taskComment",
        columns: [
          col("authorId", "int4", { codecRef: { codecId: "pg/int4@1" } }),
          col("content", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("deletedAt", "timestamptz", {
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("id", "SERIAL", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("taskId", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("updatedAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
        ],
        constraints: [primaryKey(["id"])],
      }),
      this.addColumn({
        schema: "public",
        table: "project",
        column: col("deletedAt", "timestamptz", {
          codecRef: { codecId: "pg/timestamptz-string@1" },
        }),
      }),
      this.addColumn({
        schema: "public",
        table: "project",
        column: col("deletedById", "int4", {
          codecRef: { codecId: "pg/int4@1" },
        }),
      }),
      this.addColumn({
        schema: "public",
        table: "project",
        column: col("scheduledDeletionAt", "timestamptz", {
          codecRef: { codecId: "pg/timestamptz-string@1" },
        }),
      }),
      this.addColumn({
        schema: "public",
        table: "task",
        column: col("assigneeId", "int4", {
          codecRef: { codecId: "pg/int4@1" },
        }),
      }),
      this.addColumn({
        schema: "public",
        table: "task",
        column: col("deletedAt", "timestamptz", {
          codecRef: { codecId: "pg/timestamptz-string@1" },
        }),
      }),
      this.addColumn({
        schema: "public",
        table: "task",
        column: col("deletedById", "int4", {
          codecRef: { codecId: "pg/int4@1" },
        }),
      }),
      this.addColumn({
        schema: "public",
        table: "task",
        column: col("scheduledDeletionAt", "timestamptz", {
          codecRef: { codecId: "pg/timestamptz-string@1" },
        }),
      }),
      this.addColumn({
        schema: "public",
        table: "user",
        column: col("deactivatedAt", "timestamptz", {
          codecRef: { codecId: "pg/timestamptz-string@1" },
        }),
      }),
      this.addColumn({
        schema: "public",
        table: "user",
        column: col("deletedAt", "timestamptz", {
          codecRef: { codecId: "pg/timestamptz-string@1" },
        }),
      }),
      this.addColumn({
        schema: "public",
        table: "user",
        column: col("deletionRequestedAt", "timestamptz", {
          codecRef: { codecId: "pg/timestamptz-string@1" },
        }),
      }),
      this.addColumn({
        schema: "public",
        table: "user",
        column: col("isProtectedAdmin", "bool", {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: "pg/bool@1" },
        }),
      }),
      this.addColumn({
        schema: "public",
        table: "user",
        column: col("role", "text", {
          notNull: true,
          default: lit("USER"),
          codecRef: { codecId: "pg/text@1" },
        }),
      }),
      this.addColumn({
        schema: "public",
        table: "user",
        column: col("scheduledDeletionAt", "timestamptz", {
          codecRef: { codecId: "pg/timestamptz-string@1" },
        }),
      }),
      this.addColumn({
        schema: "public",
        table: "user",
        column: col("status", "text", {
          notNull: true,
          default: lit("ACTIVE"),
          codecRef: { codecId: "pg/text@1" },
        }),
      }),
      this.addColumn({
        schema: "public",
        table: "project",
        column: col("ownerId", "int4", { codecRef: { codecId: "pg/int4@1" } }),
      }),
      this.setNotNull({
        schema: "public",
        table: "project",
        column: "ownerId",
      }),
      this.addColumn({
        schema: "public",
        table: "task",
        column: col("creatorId", "int4", {
          codecRef: { codecId: "pg/int4@1" },
        }),
      }),
      this.setNotNull({ schema: "public", table: "task", column: "creatorId" }),
      this.addUnique({
        schema: "public",
        table: "projectInvitation",
        constraint: "projectInvitation_tokenHash_key",
        columns: ["tokenHash"],
      }),
      this.addUnique({
        schema: "public",
        table: "projectMember",
        constraint: "projectMember_projectId_userId_key",
        columns: ["projectId", "userId"],
      }),
      this.addCheckConstraint({
        schema: "public",
        table: "user",
        constraint: "user_role_check_1954e8c0",
        expression: "\"role\" IN ('USER', 'ADMIN')",
      }),
      this.addCheckConstraint({
        schema: "public",
        table: "user",
        constraint: "user_status_check_a0539583",
        expression:
          "\"status\" IN ('ACTIVE', 'DEACTIVATED', 'PENDING_DELETION', 'DELETED')",
      }),
      this.createIndex({
        schema: "public",
        table: "accountActivity",
        index: "accountActivity_action_idx_cd0d2116",
        columns: ["action"],
      }),
      this.createIndex({
        schema: "public",
        table: "accountActivity",
        index: "accountActivity_actorId_idx_a58f6b4b",
        columns: ["actorId"],
      }),
      this.createIndex({
        schema: "public",
        table: "accountActivity",
        index: "accountActivity_userId_createdAt_idx_f726f04a",
        columns: ["userId", "createdAt"],
      }),
      this.createIndex({
        schema: "public",
        table: "accountActivity",
        index: "accountActivity_userId_idx_a489d58a",
        columns: ["userId"],
      }),
      this.createIndex({
        schema: "public",
        table: "notification",
        index: "notification_createdAt_idx_9575dbd7",
        columns: ["createdAt"],
      }),
      this.createIndex({
        schema: "public",
        table: "notification",
        index: "notification_projectId_idx_a96e4d92",
        columns: ["projectId"],
      }),
      this.createIndex({
        schema: "public",
        table: "notification",
        index: "notification_taskId_idx_4965c936",
        columns: ["taskId"],
      }),
      this.createIndex({
        schema: "public",
        table: "notification",
        index: "notification_userId_idx_a489d58a",
        columns: ["userId"],
      }),
      this.createIndex({
        schema: "public",
        table: "notification",
        index: "notification_userId_isRead_createdAt_idx_33778255",
        columns: ["userId", "isRead", "createdAt"],
      }),
      this.createIndex({
        schema: "public",
        table: "project",
        index: "project_deletedAt_idx_a39f721c",
        columns: ["deletedAt"],
      }),
      this.createIndex({
        schema: "public",
        table: "project",
        index: "project_deletedById_idx_6409fd1e",
        columns: ["deletedById"],
      }),
      this.createIndex({
        schema: "public",
        table: "project",
        index: "project_ownerId_idx_e2d0c1ef",
        columns: ["ownerId"],
      }),
      this.createIndex({
        schema: "public",
        table: "project",
        index: "project_scheduledDeletionAt_idx_7a2b40d2",
        columns: ["scheduledDeletionAt"],
      }),
      this.createIndex({
        schema: "public",
        table: "projectActivity",
        index: "projectActivity_action_idx_cd0d2116",
        columns: ["action"],
      }),
      this.createIndex({
        schema: "public",
        table: "projectActivity",
        index: "projectActivity_actorId_idx_a58f6b4b",
        columns: ["actorId"],
      }),
      this.createIndex({
        schema: "public",
        table: "projectActivity",
        index: "projectActivity_projectId_createdAt_idx_d2d6484f",
        columns: ["projectId", "createdAt"],
      }),
      this.createIndex({
        schema: "public",
        table: "projectActivity",
        index: "projectActivity_projectId_idx_a96e4d92",
        columns: ["projectId"],
      }),
      this.createIndex({
        schema: "public",
        table: "projectInvitation",
        index: "projectInvitation_email_status_idx_503176b9",
        columns: ["email", "status"],
      }),
      this.createIndex({
        schema: "public",
        table: "projectInvitation",
        index: "projectInvitation_expiresAt_idx_6b6b8c10",
        columns: ["expiresAt"],
      }),
      this.createIndex({
        schema: "public",
        table: "projectInvitation",
        index: "projectInvitation_projectId_idx_a96e4d92",
        columns: ["projectId"],
      }),
      this.createIndex({
        schema: "public",
        table: "projectInvitation",
        index: "projectInvitation_projectId_status_idx_57a5993e",
        columns: ["projectId", "status"],
      }),
      this.createIndex({
        schema: "public",
        table: "projectInvitation",
        index: "projectInvitation_recipientId_idx_c9527cf8",
        columns: ["recipientId"],
      }),
      this.createIndex({
        schema: "public",
        table: "projectInvitation",
        index: "projectInvitation_recipientId_status_idx_06c03403",
        columns: ["recipientId", "status"],
      }),
      this.createIndex({
        schema: "public",
        table: "projectInvitation",
        index: "projectInvitation_senderId_idx_4689c490",
        columns: ["senderId"],
      }),
      this.createIndex({
        schema: "public",
        table: "projectMember",
        index: "projectMember_projectId_idx_a96e4d92",
        columns: ["projectId"],
      }),
      this.createIndex({
        schema: "public",
        table: "projectMember",
        index: "projectMember_userId_idx_a489d58a",
        columns: ["userId"],
      }),
      this.createIndex({
        schema: "public",
        table: "projectMembershipHistory",
        index: "pmh_project_user_created_idx",
        columns: ["projectId", "userId", "createdAt"],
      }),
      this.createIndex({
        schema: "public",
        table: "projectMembershipHistory",
        index: "projectMembershipHistory_performedById_idx_ae2dd11d",
        columns: ["performedById"],
      }),
      this.createIndex({
        schema: "public",
        table: "projectMembershipHistory",
        index: "projectMembershipHistory_projectId_idx_a96e4d92",
        columns: ["projectId"],
      }),
      this.createIndex({
        schema: "public",
        table: "projectMembershipHistory",
        index: "projectMembershipHistory_userId_createdAt_idx_f726f04a",
        columns: ["userId", "createdAt"],
      }),
      this.createIndex({
        schema: "public",
        table: "projectMembershipHistory",
        index: "projectMembershipHistory_userId_idx_a489d58a",
        columns: ["userId"],
      }),
      this.createIndex({
        schema: "public",
        table: "session",
        index: "session_expiresAt_idx_6b6b8c10",
        columns: ["expiresAt"],
      }),
      this.createIndex({
        schema: "public",
        table: "task",
        index: "task_assigneeId_idx_fd12ae38",
        columns: ["assigneeId"],
      }),
      this.createIndex({
        schema: "public",
        table: "task",
        index: "task_creatorId_idx_3a77d800",
        columns: ["creatorId"],
      }),
      this.createIndex({
        schema: "public",
        table: "task",
        index: "task_deletedAt_idx_a39f721c",
        columns: ["deletedAt"],
      }),
      this.createIndex({
        schema: "public",
        table: "task",
        index: "task_deletedById_idx_6409fd1e",
        columns: ["deletedById"],
      }),
      this.createIndex({
        schema: "public",
        table: "task",
        index: "task_scheduledDeletionAt_idx_7a2b40d2",
        columns: ["scheduledDeletionAt"],
      }),
      this.createIndex({
        schema: "public",
        table: "taskActivity",
        index: "taskActivity_action_idx_cd0d2116",
        columns: ["action"],
      }),
      this.createIndex({
        schema: "public",
        table: "taskActivity",
        index: "taskActivity_actorId_idx_a58f6b4b",
        columns: ["actorId"],
      }),
      this.createIndex({
        schema: "public",
        table: "taskActivity",
        index: "taskActivity_taskId_createdAt_idx_f41547ff",
        columns: ["taskId", "createdAt"],
      }),
      this.createIndex({
        schema: "public",
        table: "taskActivity",
        index: "taskActivity_taskId_idx_4965c936",
        columns: ["taskId"],
      }),
      this.createIndex({
        schema: "public",
        table: "taskAssignmentHistory",
        index: "taskAssignmentHistory_newAssigneeId_idx_e9a25e3a",
        columns: ["newAssigneeId"],
      }),
      this.createIndex({
        schema: "public",
        table: "taskAssignmentHistory",
        index: "taskAssignmentHistory_performedById_idx_ae2dd11d",
        columns: ["performedById"],
      }),
      this.createIndex({
        schema: "public",
        table: "taskAssignmentHistory",
        index: "taskAssignmentHistory_previousAssigneeId_idx_26ed9c27",
        columns: ["previousAssigneeId"],
      }),
      this.createIndex({
        schema: "public",
        table: "taskAssignmentHistory",
        index: "taskAssignmentHistory_taskId_createdAt_idx_f41547ff",
        columns: ["taskId", "createdAt"],
      }),
      this.createIndex({
        schema: "public",
        table: "taskAssignmentHistory",
        index: "taskAssignmentHistory_taskId_idx_4965c936",
        columns: ["taskId"],
      }),
      this.createIndex({
        schema: "public",
        table: "taskComment",
        index: "taskComment_authorId_idx_e47547ed",
        columns: ["authorId"],
      }),
      this.createIndex({
        schema: "public",
        table: "taskComment",
        index: "taskComment_deletedAt_idx_a39f721c",
        columns: ["deletedAt"],
      }),
      this.createIndex({
        schema: "public",
        table: "taskComment",
        index: "taskComment_taskId_createdAt_idx_f41547ff",
        columns: ["taskId", "createdAt"],
      }),
      this.createIndex({
        schema: "public",
        table: "taskComment",
        index: "taskComment_taskId_idx_4965c936",
        columns: ["taskId"],
      }),
      this.addForeignKey({
        schema: "public",
        table: "accountActivity",
        foreignKey: {
          name: "accountActivity_userId_fkey",
          columns: ["userId"],
          references: { schema: "public", table: "user", columns: ["id"] },
          onDelete: "restrict",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "accountActivity",
        foreignKey: {
          name: "accountActivity_actorId_fkey",
          columns: ["actorId"],
          references: { schema: "public", table: "user", columns: ["id"] },
          onDelete: "setNull",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "notification",
        foreignKey: {
          name: "notification_userId_fkey",
          columns: ["userId"],
          references: { schema: "public", table: "user", columns: ["id"] },
          onDelete: "cascade",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "project",
        foreignKey: {
          name: "project_deletedById_fkey",
          columns: ["deletedById"],
          references: { schema: "public", table: "user", columns: ["id"] },
          onDelete: "setNull",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "project",
        foreignKey: {
          name: "project_ownerId_fkey",
          columns: ["ownerId"],
          references: { schema: "public", table: "user", columns: ["id"] },
          onDelete: "restrict",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "projectActivity",
        foreignKey: {
          name: "projectActivity_projectId_fkey",
          columns: ["projectId"],
          references: { schema: "public", table: "project", columns: ["id"] },
          onDelete: "cascade",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "projectActivity",
        foreignKey: {
          name: "projectActivity_actorId_fkey",
          columns: ["actorId"],
          references: { schema: "public", table: "user", columns: ["id"] },
          onDelete: "setNull",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "projectInvitation",
        foreignKey: {
          name: "projectInvitation_projectId_fkey",
          columns: ["projectId"],
          references: { schema: "public", table: "project", columns: ["id"] },
          onDelete: "cascade",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "projectInvitation",
        foreignKey: {
          name: "projectInvitation_senderId_fkey",
          columns: ["senderId"],
          references: { schema: "public", table: "user", columns: ["id"] },
          onDelete: "restrict",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "projectInvitation",
        foreignKey: {
          name: "projectInvitation_recipientId_fkey",
          columns: ["recipientId"],
          references: { schema: "public", table: "user", columns: ["id"] },
          onDelete: "setNull",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "projectMember",
        foreignKey: {
          name: "projectMember_projectId_fkey",
          columns: ["projectId"],
          references: { schema: "public", table: "project", columns: ["id"] },
          onDelete: "cascade",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "projectMember",
        foreignKey: {
          name: "projectMember_userId_fkey",
          columns: ["userId"],
          references: { schema: "public", table: "user", columns: ["id"] },
          onDelete: "restrict",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "projectMembershipHistory",
        foreignKey: {
          name: "projectMembershipHistory_projectId_fkey",
          columns: ["projectId"],
          references: { schema: "public", table: "project", columns: ["id"] },
          onDelete: "cascade",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "projectMembershipHistory",
        foreignKey: {
          name: "projectMembershipHistory_userId_fkey",
          columns: ["userId"],
          references: { schema: "public", table: "user", columns: ["id"] },
          onDelete: "restrict",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "projectMembershipHistory",
        foreignKey: {
          name: "projectMembershipHistory_performedById_fkey",
          columns: ["performedById"],
          references: { schema: "public", table: "user", columns: ["id"] },
          onDelete: "setNull",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "task",
        foreignKey: {
          name: "task_assigneeId_fkey",
          columns: ["assigneeId"],
          references: { schema: "public", table: "user", columns: ["id"] },
          onDelete: "setNull",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "task",
        foreignKey: {
          name: "task_creatorId_fkey",
          columns: ["creatorId"],
          references: { schema: "public", table: "user", columns: ["id"] },
          onDelete: "restrict",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "task",
        foreignKey: {
          name: "task_deletedById_fkey",
          columns: ["deletedById"],
          references: { schema: "public", table: "user", columns: ["id"] },
          onDelete: "setNull",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "taskActivity",
        foreignKey: {
          name: "taskActivity_taskId_fkey",
          columns: ["taskId"],
          references: { schema: "public", table: "task", columns: ["id"] },
          onDelete: "cascade",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "taskActivity",
        foreignKey: {
          name: "taskActivity_actorId_fkey",
          columns: ["actorId"],
          references: { schema: "public", table: "user", columns: ["id"] },
          onDelete: "setNull",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "taskAssignmentHistory",
        foreignKey: {
          name: "taskAssignmentHistory_taskId_fkey",
          columns: ["taskId"],
          references: { schema: "public", table: "task", columns: ["id"] },
          onDelete: "cascade",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "taskAssignmentHistory",
        foreignKey: {
          name: "taskAssignmentHistory_previousAssigneeId_fkey",
          columns: ["previousAssigneeId"],
          references: { schema: "public", table: "user", columns: ["id"] },
          onDelete: "setNull",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "taskAssignmentHistory",
        foreignKey: {
          name: "taskAssignmentHistory_newAssigneeId_fkey",
          columns: ["newAssigneeId"],
          references: { schema: "public", table: "user", columns: ["id"] },
          onDelete: "setNull",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "taskAssignmentHistory",
        foreignKey: {
          name: "taskAssignmentHistory_performedById_fkey",
          columns: ["performedById"],
          references: { schema: "public", table: "user", columns: ["id"] },
          onDelete: "setNull",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "taskComment",
        foreignKey: {
          name: "taskComment_taskId_fkey",
          columns: ["taskId"],
          references: { schema: "public", table: "task", columns: ["id"] },
          onDelete: "cascade",
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "taskComment",
        foreignKey: {
          name: "taskComment_authorId_fkey",
          columns: ["authorId"],
          references: { schema: "public", table: "user", columns: ["id"] },
          onDelete: "setNull",
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
