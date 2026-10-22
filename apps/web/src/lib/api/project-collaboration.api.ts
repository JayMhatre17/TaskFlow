import { apiRequest } from "./client";

export type ProjectMemberSummary = {
  userId: number;
  name?: string;
  email?: string;
  joinedAt: string;
};

export type ProjectMemberCandidate = {
  id: number;
  name: string;
  email: string;
};

export type ProjectMembership = {
  id: number;
  projectId: number;
  userId: number;
  addedById: number | null;
  joinedAt: string;
  removedAt: string | null;
};

export type ProjectInvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

// Keep frontend invitation data limited to the public fields used by the UI.
export type ProjectInvitation = {
  id: number;
  projectId: number;
  email: string;
  status: ProjectInvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
};

export type CreateProjectInvitationResult = {
  message: string;
  invitation: ProjectInvitation;
  token: string;
};

export type ProjectInvitationResult = {
  message: string;
  invitation: ProjectInvitation;
};

export type ProjectInvitationAcceptanceResult = {
  message: string;
  // The action endpoint currently returns the created membership under `invitation`.
  invitation: ProjectMembership;
};

export type AddProjectMemberInput = {
  projectId: number;
  userId: number;
};

export type RemoveProjectMemberInput = {
  projectId: number;
  userId: number;
};

export type CreateProjectInvitationInput = {
  projectId: number;
  email: string;
};

export type CancelProjectInvitationInput = {
  projectId: number;
  invitationId: number;
};

const toProjectInvitation = (
  invitation: ProjectInvitation,
): ProjectInvitation => ({
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

export const getProjectMembers = (projectId: number) =>
  apiRequest<ProjectMemberSummary[]>({
    method: "GET",
    path: `/api/projects/${projectId}/members`,
  });

export const addProjectMember = ({ projectId, userId }: AddProjectMemberInput) =>
  apiRequest<ProjectMembership>({
    method: "POST",
    path: `/api/projects/${projectId}/members`,
    body: { userId },
  });

export const removeProjectMember = ({
  projectId,
  userId,
}: RemoveProjectMemberInput) =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/projects/${projectId}/members/${userId}`,
  });

export const getMyProjectInvitations = async () => {
  const response = await apiRequest<{ invitations: ProjectInvitation[] }>({
    method: "GET",
    path: "/api/projects/invitations",
  });

  return {
    invitations: response.invitations.map(toProjectInvitation),
  };
};

export const getProjectInvitations = async (projectId: number) => {
  const response = await apiRequest<{ invitations: ProjectInvitation[] }>({
    method: "GET",
    path: `/api/projects/${projectId}/invitations`,
  });

  return {
    invitations: response.invitations.map(toProjectInvitation),
  };
};

export const searchProjectMemberCandidates = async (
  projectId: number,
  query: string,
) =>
  apiRequest<{ users: ProjectMemberCandidate[] }>({
    method: "GET",
    path: `/api/projects/${projectId}/members/search?q=${encodeURIComponent(query)}`,
  });

export const createProjectInvitation = async ({
  projectId,
  email,
}: CreateProjectInvitationInput) => {
  const response = await apiRequest<CreateProjectInvitationResult>({
    method: "POST",
    path: `/api/projects/${projectId}/invitations`,
    body: { email },
  });

  return {
    ...response,
    invitation: toProjectInvitation(response.invitation),
  };
};

export const cancelProjectInvitation = async ({
  projectId,
  invitationId,
}: CancelProjectInvitationInput) => {
  const response = await apiRequest<ProjectInvitationResult>({
    method: "POST",
    path: `/api/projects/${projectId}/invitations/${invitationId}/cancel`,
  });

  return {
    ...response,
    invitation: toProjectInvitation(response.invitation),
  };
};

export const acceptProjectInvitation = (token: string) =>
  apiRequest<ProjectInvitationAcceptanceResult>({
    method: "POST",
    path: `/api/projects/invitations/${encodeURIComponent(token)}/action`,
    body: { action: "ACCEPT" },
  });

export const rejectProjectInvitation = (token: string) =>
  apiRequest<ProjectInvitationResult>({
    method: "POST",
    path: `/api/projects/invitations/${encodeURIComponent(token)}/action`,
    body: { action: "REJECT" },
  });
