export type UserIdentity = {
  name?: string | null;
  email?: string | null;
};

const nonEmpty = (value: string | null | undefined) => value?.trim() || null;

export const formatUserName = (
  identity: UserIdentity | null | undefined,
  fallback = "Former user",
) => nonEmpty(identity?.name) ?? nonEmpty(identity?.email) ?? fallback;

export const formatUserInContext = (
  userId: number | null,
  identity: UserIdentity | null | undefined,
  currentUserId: number | undefined,
  fallback = "Former user",
) => {
  if (userId === null) return fallback;
  if (currentUserId !== undefined && userId === currentUserId) return "You";
  return formatUserName(identity, fallback);
};

export const getDistinctUserEmail = (
  email: string | null | undefined,
  primaryLabel: string,
) => {
  const normalizedEmail = nonEmpty(email);
  return normalizedEmail &&
    normalizedEmail.toLowerCase() !== primaryLabel.trim().toLowerCase()
    ? normalizedEmail
    : null;
};

export const formatUserOptionLabel = (
  identity: UserIdentity | null | undefined,
  fallback = "Former user",
) => {
  const name = formatUserName(identity, fallback);
  const email = getDistinctUserEmail(identity?.email, name);
  return email ? `${name} (${email})` : name;
};
