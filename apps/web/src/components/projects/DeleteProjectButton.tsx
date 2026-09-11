"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDeleteProject } from "@/hooks/mutation/useDeleteProject";
import { useState } from "react";
import { useProjectTasks } from "@/hooks/queries/useProjectTasks";
import DeleteProjectDialog from "./DeleteProjectDailogBox";

type DeleteProjectButtonProps = {
  projectId: number;
  projectName: string;
};

const DeleteProjectButton = ({
  projectId,
  projectName,
}: DeleteProjectButtonProps) => {
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };
  const {
    data: tasks = [],
    isPending: isLoadingTasks,
    isError: isTaskError,
    refetch: refetchTasks,
  } = useProjectTasks(projectId, dialogOpen);

  const { mutateAsync: deleteProject, isPending: isDeleting } =
    useDeleteProject();

  const handleDelete = async () => {
    try {
      await deleteProject(projectId);

      toast.success("Project deleted successfully");
      setDialogOpen(false);

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
    <>
      <Button
        variant="destructive"
        onClick={handleOpenDialog}
        className={"cursor-pointer"}
      >
        Delete Project
      </Button>

      <DeleteProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectName={projectName}
        tasks={tasks}
        isDeleting={isDeleting || isLoadingTasks}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default DeleteProjectButton;
