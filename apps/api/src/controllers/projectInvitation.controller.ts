import { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/api.error";
import {
  createProjectInvitationSchema,
  projectInvitationActionSchema,
} from "../schema/projectInvitation.schema";
import {
  acceptProjectInvitation,
  cancelProjectInvitation,
  createProjectInvitation,
  getMyProjectInvitations,
  getProjectInvitationsForOwner,
  rejectProjectInvitation,
} from "../service/projectInvitation.service";

const toPublicProjectInvitation = (invitation: {
  id: number;
  projectId: number;
  email: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELLED";
  expiresAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}) => ({
  id: invitation.id,
  projectId: invitation.projectId,
  email: invitation.email,
  status: invitation.status,
  expiresAt: invitation.expiresAt,
  acceptedAt: invitation.acceptedAt,
  rejectedAt: invitation.rejectedAt,
  cancelledAt: invitation.cancelledAt,
  createdAt: invitation.createdAt,
});

export const createProjectInvitationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
      throw new ApiError(400, "Invalid project ID");
    }
    const result = createProjectInvitationSchema.safeParse(req.body);

    if (!result.success) {
      throw new ApiError(400, "Invalid invitation data");
    }

    const invitation = await createProjectInvitation(
      projectId,
      result.data.email,
      req.user!.id,
    );

    return res.status(201).json({
      message: "Project invitiation created successfully",
      invitation: toPublicProjectInvitation(invitation.invitation),
      token: invitation.token,
    });
  } catch (error) {
    return next(error);
  }
};

export const acceptProjectInvitationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.params.token;

    if (!token || typeof token !== "string") {
      throw new ApiError(400, "Invalid invitation token");
    }

    const member = await acceptProjectInvitation(token, req.user!.id);

    return res.status(200).json({
      message: "Project invitation accepted successfully",
      member,
    });
  } catch (error) {
    return next(error);
  }
};

export const projectInvitationActionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.params.token;

    if (!token || typeof token !== "string") {
      throw new ApiError(400, "Invalid invitation token");
    }

    const result = projectInvitationActionSchema.safeParse(req.body);

    if (!result.success) {
      throw new ApiError(400, "Invalid invitation action data");
    }

    const { action } = result.data;
    let invitation;
    if (action === "ACCEPT") {
      invitation = await acceptProjectInvitation(token, req.user!.id);
    } else if (action === "REJECT") {
      const rejectedInvitation = await rejectProjectInvitation(
        token,
        req.user!.id,
      );
      invitation = rejectedInvitation
        ? toPublicProjectInvitation(rejectedInvitation)
        : null;
    }

    return res.status(200).json({
      message: `Project invitation ${action.toLowerCase()}ed successfully`,
      invitation,
    });
  } catch (error) {
    return next(error);
  }
};

export const cancelProjectInvitationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = Number(req.params.projectId);
    const invitationId = Number(req.params.invitationId);

    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
      throw new ApiError(400, "Invalid project ID");
    }

    if (!Number.isSafeInteger(invitationId) || invitationId <= 0) {
      throw new ApiError(400, "Invalid invitation ID");
    }

    const invitation = await cancelProjectInvitation(
      invitationId,
      req.user!.id,
      projectId,
    );

    return res.status(200).json({
      message: "Project invitation cancelled successfully",
      invitation: invitation ? toPublicProjectInvitation(invitation) : null,
    });
  } catch (error) {
    return next(error);
  }
};

export const getMyProjectInvitationsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const invitations = await getMyProjectInvitations(req.user!.id);

    return res.status(200).json({
      invitations: invitations.map(toPublicProjectInvitation),
    });
  } catch (error) {
    return next(error);
  }
};

export const getProjectInvitationsForProjectController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
      throw new ApiError(400, "Invalid project ID");
    }

    const invitations = await getProjectInvitationsForOwner(
      projectId,
      req.user!.id,
    );

    return res.status(200).json({
      invitations: invitations.map(toPublicProjectInvitation),
    });
  } catch (error) {
    return next(error);
  }
};
