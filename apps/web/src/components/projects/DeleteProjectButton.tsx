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
import { useDeleteProject } from "@/hooks/mutation/useDeleteProject";

type DeleteProjectButtonProps = {
  projectId: number;
};

const DeleteProjectButton = ({ projectId }: DeleteProjectButtonProps) => {
  const router = useRouter();
  const { mutateAsync: deleteProject } = useDeleteProject();
  const handleDelete = async () => {
    try {
      await deleteProject(projectId);

      toast.success("Project deleted successfully");

      router.push("/projects");
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
          <AlertDialogTitle>Delete this project?</AlertDialogTitle>

          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            project and its data.
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

export default DeleteProjectButton;
