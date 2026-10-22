const INVITATION_TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const INVITATION_ACCEPTANCE_PATH = "/invitations/accept";

export const getInvitationAcceptancePath = (token: string) => {
  const search = new URLSearchParams({ token });
  return `${INVITATION_ACCEPTANCE_PATH}?${search.toString()}`;
};

export const getInvitationLoginPath = (returnTo: string) => {
  const search = new URLSearchParams({ returnTo });
  return `/login?${search.toString()}`;
};

export const getSafePostLoginPath = (returnTo: string | null) => {
  if (
    !returnTo ||
    !returnTo.startsWith("/") ||
    returnTo.startsWith("//") ||
    returnTo.includes("\\")
  ) {
    return "/dashboard";
  }

  try {
    const destination = new URL(returnTo, "https://taskflow.invalid");
    const keys = [...destination.searchParams.keys()];
    const tokens = destination.searchParams.getAll("token");

    if (
      destination.origin !== "https://taskflow.invalid" ||
      destination.pathname !== INVITATION_ACCEPTANCE_PATH ||
      destination.hash ||
      keys.length !== 1 ||
      keys[0] !== "token" ||
      tokens.length !== 1 ||
      !INVITATION_TOKEN_PATTERN.test(tokens[0])
    ) {
      return "/dashboard";
    }

    return `${destination.pathname}${destination.search}`;
  } catch {
    return "/dashboard";
  }
};
