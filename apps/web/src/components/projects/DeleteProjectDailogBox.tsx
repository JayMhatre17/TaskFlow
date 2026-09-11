"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { Task } from "@/lib/api/task.api";

type DeleteProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  projectName: string;
  tasks: Task[];

  isDeleting: boolean;
  onConfirm: () => void;
};

const DeleteProjectDialog = ({
  open,
  onOpenChange,
  projectName,
  tasks,
  isDeleting,
  onConfirm,
}: DeleteProjectDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Project?</AlertDialogTitle>

          <AlertDialogDescription>
            You are about to permanently delete{" "}
            <span className="font-medium text-foreground">{projectName}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border p-4">
            <p className="text-sm font-medium">
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"} will also
              be deleted.
            </p>

            {tasks.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {tasks.map((task) => (
                  <li key={task.id}>{task.title}</li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-sm font-medium text-destructive">
            This action cannot be undone.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>

          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Project"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteProjectDialog;
