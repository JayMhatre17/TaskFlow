import { Temporal } from "@js-temporal/polyfill";
import { ApiError } from "../errors/api.error";
import { db } from "../prisma/db";
import {
  CreateTaskCommentInput,
  UpdateTaskCommentInput,
} from "../schema/taskComment.schema";
import { getProjectAccess } from "./projectAccess.service";

type TaskCommentRecord = Awaited<
  ReturnType<typeof db.orm.public.TaskComment.all>
>[number];

type TaskCommentAuthor = {
  id: number;
  name: string;
  email: string;
};

const attachCommentAuthors = async (comments: TaskCommentRecord[]) => {
  const authorIds = [
    ...new Set(
      comments.flatMap((comment) =>
        comment.authorId === null ? [] : [comment.authorId],
      ),
    ),
  ];

  if (authorIds.length === 0) {
    return comments.map((comment) => ({ ...comment, author: null }));
  }

  const users = await db.orm.public.User.select(
    "id",
    "name",
    "email",
    "status",
  )
    .where((user) => user.id.in(authorIds))
    .all();

  const authors = new Map<number, TaskCommentAuthor>(
    users
      .filter((user) => user.status !== "DELETED")
      .map(({ id, name, email }) => [id, { id, name, email }]),
  );

  return comments.map((comment) => ({
    ...comment,
    author:
      comment.authorId === null ? null : (authors.get(comment.authorId) ?? null),
  }));
};

export const getAccessibleTask = async (taskId: number, userId: number) => {
  const task = await db.orm.public.Task.where({
    id: taskId,
  }).first();

  if (!task || task.deletedAt !== null) {
    throw new ApiError(404, "Task not found");
  }

  const access = await getProjectAccess(task.projectId, userId);

  if (!access) {
    throw new ApiError(404, "Task not found");
  }

  return task;
};

export const getTaskComments = async (taskId: number, userId: number) => {
  await getAccessibleTask(taskId, userId);

  const comments = await db.orm.public.TaskComment.where({
    taskId,
    deletedAt: null,
  }).all();

  return attachCommentAuthors(comments);
};

export const createTaskComment = async (
  taskId: number,
  data: CreateTaskCommentInput,
  userId: number,
) => {
  await getAccessibleTask(taskId, userId);

  const comment = await db.transaction(async (tx) => {
    const comment = await tx.orm.public.TaskComment.create({
      taskId,
      authorId: userId,
      content: data.content.trim(),
    });

    await tx.orm.public.TaskActivity.create({
      taskId,
      actorId: userId,
      action: "COMMENT_ADDED",
      field: "content",
      description: "Added a comment",
    });

    return comment;
  });

  return (await attachCommentAuthors([comment]))[0];
};

export const updateTaskComment = async (
  commentId: number,
  data: UpdateTaskCommentInput,
  userId: number,
) => {
  const comment = await db.orm.public.TaskComment.where({
    id: commentId,
    deletedAt: null,
  }).first();

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  await getAccessibleTask(comment.taskId, userId);

  if (comment.authorId !== userId) {
    throw new ApiError(403, "You can only edit your own comments");
  }

  const updatedComment = await db.transaction(async (tx) => {
    const updatedComment = await tx.orm.public.TaskComment.where({
      id: commentId,
      deletedAt: null,
    }).update({
      content: data.content.trim(),
      updatedAt: Temporal.Now.instant().toString(),
    });

    if (!updatedComment) {
      return null;
    }

    await tx.orm.public.TaskActivity.create({
      taskId: comment.taskId,
      actorId: userId,
      action: "COMMENT_UPDATED",
      field: "content",
      description: "Updated a comment",
    });

    return updatedComment;
  });

  return updatedComment
    ? (await attachCommentAuthors([updatedComment]))[0]
    : null;
};

export const deleteTaskComment = async (commentId: number, userId: number) => {
  const comment = await db.orm.public.TaskComment.where({
    id: commentId,
    deletedAt: null,
  }).first();

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  await getAccessibleTask(comment.taskId, userId);

  if (comment.authorId !== userId) {
    throw new ApiError(403, "You can only delete your own comments");
  }

  return db.transaction(async (tx) => {
    const deletedAt = Temporal.Now.instant().toString();

    const deletedComment = await tx.orm.public.TaskComment.where({
      id: commentId,
      deletedAt: null,
    }).update({
      deletedAt,
      updatedAt: deletedAt,
    });

    if (!deletedComment) {
      return null;
    }

    await tx.orm.public.TaskActivity.create({
      taskId: comment.taskId,
      actorId: userId,
      action: "COMMENT_DELETED",
      field: "content",
      description: "Deleted a comment",
    });

    return deletedComment;
  });
};
