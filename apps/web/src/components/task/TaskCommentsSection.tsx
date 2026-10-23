"use client";

import { useRef, useState, type FormEvent } from "react";
import { useCurrentUser } from "@/hooks/queries/useAuth";
import { useTaskComments } from "@/hooks/queries/useTaskComments";
import { useCreateTaskComment } from "@/hooks/mutation/useCreateTaskComment";
import LoadingState from "@/components/states/LoadingState";
import ErrorState from "@/components/states/ErrorState";
import { Button } from "@/components/ui/button";
import { formatUserInContext } from "@/lib/user-display";

const formatTimestamp = (timestamp: string) =>
  new Date(timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const TaskCommentsSection = ({ taskId }: { taskId: number }) => {
  const commentsQuery = useTaskComments(taskId);
  const createCommentMutation = useCreateTaskComment();
  const currentUserQuery = useCurrentUser();
  const submissionInProgress = useRef(false);
  const [content, setContent] = useState("");

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedContent = content.trim();

    if (
      !trimmedContent ||
      trimmedContent.length > 2000 ||
      submissionInProgress.current
    ) {
      return;
    }

    submissionInProgress.current = true;
    try {
      await createCommentMutation.mutateAsync({
        taskId,
        content: trimmedContent,
      });
      setContent("");
    } catch {
      // The mutation error is displayed below the form.
    } finally {
      submissionInProgress.current = false;
    }
  };

  return (
    <section className="min-w-0 rounded-xl border bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold">Comments</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share updates and context with people on this project.
        </p>
      </div>

      <form onSubmit={submitComment} className="mt-5 space-y-3">
        <label htmlFor={`task-comment-${taskId}`} className="sr-only">
          Add a comment
        </label>
        <textarea
          id={`task-comment-${taskId}`}
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            if (createCommentMutation.isError) createCommentMutation.reset();
          }}
          maxLength={2000}
          rows={3}
          placeholder="Write a comment..."
          disabled={createCommentMutation.isPending}
          className="min-w-0 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {content.length}/2000 characters
          </p>
          <Button
            type="submit"
            disabled={
              !content.trim() ||
              content.trim().length > 2000 ||
              createCommentMutation.isPending
            }
          >
            {createCommentMutation.isPending ? "Posting..." : "Add comment"}
          </Button>
        </div>
        {createCommentMutation.isError && (
          <p className="text-sm text-red-600" role="alert">
            {createCommentMutation.error.message || "Unable to add comment."}
          </p>
        )}
      </form>

      <div className="mt-6 border-t pt-5">
        {commentsQuery.isPending ? (
          <LoadingState message="Loading comments..." />
        ) : commentsQuery.isError ? (
          <ErrorState
            title="Failed to load comments"
            description={commentsQuery.error.message}
            onRetry={() => void commentsQuery.refetch()}
          />
        ) : commentsQuery.data.comments.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No comments yet. Start the conversation.
          </p>
        ) : (
          <ul className="space-y-4">
            {commentsQuery.data.comments.map((comment) => {
              const authorLabel = formatUserInContext(
                comment.authorId,
                comment.author,
                currentUserQuery.data?.user.id,
              );

              return (
                <li key={comment.id} className="rounded-lg bg-gray-50 p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="break-words text-sm font-medium text-gray-900 [overflow-wrap:anywhere]">
                      {authorLabel}
                    </p>
                    <time
                      dateTime={comment.createdAt}
                      className="text-xs text-muted-foreground"
                    >
                      {formatTimestamp(comment.createdAt)}
                    </time>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-700">
                    {comment.content}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};

export default TaskCommentsSection;
