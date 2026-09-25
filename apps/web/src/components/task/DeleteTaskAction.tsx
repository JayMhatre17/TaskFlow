"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useDeleteTask } from "@/hooks/mutation/useDeleteTask";

import DeleteTaskDialog from "./DeleteTaskDialog";

type DeleteTaskActionProps = {
  taskId: number;
  taskTitle: string;
};

const DeleteTaskAction = ({ taskId, taskTitle }: DeleteTaskActionProps) => {
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);

  const { mutateAsync: deleteTask, isPending } = useDeleteTask();

  const handleDelete = async () => {
    try {
      await deleteTask(taskId);

      toast.success("Task deleted successfully");

      setDialogOpen(false);

      router.push("/tasks");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete task",
      );
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setDialogOpen(true)}
        className={"cursor-pointer"}
      >
        Delete Task
      </Button>

      <DeleteTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        taskTitle={taskTitle}
        isDeleting={isPending}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default DeleteTaskAction;
