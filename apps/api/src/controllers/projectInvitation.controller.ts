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
  rejectProjectInvitation,
} from "../service/projectInvitation.service";

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

    const invitaion = await createProjectInvitation(
      projectId,
      result.data.email,
      req.user!.id,
    );

    return res.status(201).json({
      message: "Project invitiation created successfully",
      invitation: invitaion.invitation,
      token: invitaion.token,
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
      invitation = await rejectProjectInvitation(token, req.user!.id);
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
      invitation,
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

    return res.status(200).json({ invitations });
  } catch (error) {
    return next(error);
  }
};
