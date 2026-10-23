import { Router } from "express";
import {
  createProjectController,
  deleteProjectController,
  getProjectOptionsController,
  getDeletedProjectsController,
  getProjectsController,
  getProjetByIdController,
  updateProjectController,
  restoreProjectController,
} from "../controllers/projects.controller";
import { getTasksByProjectController } from "../controllers/task.controller";
import { requireAuth } from "../middlewares/require-auth.middleware";
import {
  addProjectMemberController,
  getProjectMembersController,
  removeProjectMemberController,
  searchProjectMemberCandidatesController,
} from "../controllers/projectMember.controller";
import {
  cancelProjectInvitationController,
  createProjectInvitationController,
  getProjectInvitationsForProjectController,
  getMyProjectInvitationsController,
  projectInvitationActionController,
} from "../controllers/projectInvitation.controller";

const router = Router();

router.use(requireAuth);

router.get("/", getProjectsController);
router.post("/", createProjectController);

router.get("/options", getProjectOptionsController);
router.get("/invitations", getMyProjectInvitationsController);
router.get("/deleted", getDeletedProjectsController);

router.post("/invitations/:token/action", projectInvitationActionController);

router.get("/:id", getProjetByIdController);
router.post("/:id/restore", restoreProjectController);
router.patch("/:id", updateProjectController);
router.delete("/:id", deleteProjectController);

router.get("/:projectId/tasks", getTasksByProjectController);

router.get("/:projectId/members", getProjectMembersController);
router.get(
  "/:projectId/members/search",
  searchProjectMemberCandidatesController,
);
router.post("/:projectId/members", addProjectMemberController);
router.delete("/:projectId/members/:userId", removeProjectMemberController);

router.post("/:projectId/invitations", createProjectInvitationController);
router.get(
  "/:projectId/invitations",
  getProjectInvitationsForProjectController,
);

router.post(
  "/:projectId/invitations/:invitationId/cancel",
  cancelProjectInvitationController,
);

export default router;
