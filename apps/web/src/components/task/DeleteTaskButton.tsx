"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { deleteProject } from "@/lib/api/project.api";
import { deleteTask } from "@/lib/api/task.api";

type DeleteTaskButtonProps = {
  taskId: number;
};

const DeleteTaskButton = ({ taskId }: DeleteTaskButtonProps) => {
  const router = useRouter();

  const handleDelete = async () => {
    try {
      await deleteTask(taskId);

      toast.success("Project deleted successfully");

      router.push("/tasks");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete project. Please try again.",
      );
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="destructive" className="cursor-pointer" />}
      >
        Delete
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this task?</AlertDialogTitle>

          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the task
            and its data.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>

          <AlertDialogAction variant="destructive" onClick={handleDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteTaskButton;
