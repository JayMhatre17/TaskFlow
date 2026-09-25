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
type DeleteTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  isDeleting: boolean;
  onConfirm: () => void;
};

const DeleteTaskDialog = ({
  open,
  onOpenChange,
  taskTitle,
  isDeleting,
  onConfirm,
}: DeleteTaskDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Task?</AlertDialogTitle>

          <AlertDialogDescription>
            Are you sure you want to permanently delete{" "}
            <span className="font-medium text-foreground">{taskTitle}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <p className="text-sm font-medium text-destructive">
          This action cannot be undone.
        </p>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} className={"cursor-pointer"}>
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90 cursor-pointer"
          >
            {isDeleting ? "Deleting..." : "Delete Task"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteTaskDialog;
