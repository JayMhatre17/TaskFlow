"use client";

import { useCurrentUser } from "@/hooks/queries/useAuth";
import { useTaskActivities } from "@/hooks/queries/useTaskActivities";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";
import { Badge } from "@/components/ui/badge";
import { formatUserInContext } from "@/lib/user-display";

const formatTimestamp = (timestamp: string) =>
  new Date(timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const formatAction = (action: string) =>
  action.replaceAll("_", " ").toLowerCase();

const TaskActivitySection = ({ taskId }: { taskId: number }) => {
  const activitiesQuery = useTaskActivities(taskId);
  const currentUserQuery = useCurrentUser();

  return (
    <section className="min-w-0 rounded-xl border bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold">Activity</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A history of changes to this task.
        </p>
      </div>

      <div className="mt-5 border-t pt-5">
        {activitiesQuery.isPending ? (
          <LoadingState message="Loading activity..." />
        ) : activitiesQuery.isError ? (
          <ErrorState
            title="Failed to load activity"
            description={activitiesQuery.error.message}
            onRetry={() => void activitiesQuery.refetch()}
          />
        ) : activitiesQuery.data.activities.length === 0 ? (
          <EmptyState
            iconType="inbox"
            title="No activity yet"
            description="Changes to this task will appear here."
          />
        ) : (
          <ol className="space-y-4">
            {activitiesQuery.data.activities.map((activity) => {
              const actorLabel = formatUserInContext(
                activity.actorId,
                activity.actor,
                currentUserQuery.data?.user.id,
              );

              return (
                <li
                  key={activity.id}
                  className="flex flex-col gap-2 border-b pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <Badge variant="outline">{formatAction(activity.action)}</Badge>
                      <span className="break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                        by {actorLabel}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="break-words text-sm text-gray-700 [overflow-wrap:anywhere]">
                        {activity.description}
                      </p>
                    )}
                    {activity.field &&
                      (activity.oldValue !== null ||
                        activity.newValue !== null) && (
                        <p className="break-words text-xs text-muted-foreground">
                          {activity.field}: {activity.oldValue ?? "—"} → {activity.newValue ?? "—"}
                        </p>
                      )}
                  </div>
                  <time
                    dateTime={activity.createdAt}
                    className="break-words text-xs text-muted-foreground sm:shrink-0"
                  >
                    {formatTimestamp(activity.createdAt)}
                  </time>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
};

export default TaskActivitySection;
