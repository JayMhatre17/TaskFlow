"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createManagedUser,
  deactivateManagedUser,
  forceManagedUserPasswordChange,
  getManagedUsers,
  reactivateManagedUser,
  resetManagedUserPassword,
  type CreateManagedUserInput,
  type ManagedUser,
  type ManagedUsersParams,
} from "@/lib/api/admin.api";

export const adminUserQueryKeys = {
  all: ["admin", "users"] as const,
  list: (params: ManagedUsersParams) => ["admin", "users", params] as const,
};

export const useManagedUsers = (params: ManagedUsersParams) =>
  useQuery({ queryKey: adminUserQueryKeys.list(params), queryFn: () => getManagedUsers(params) });

export const useCreateManagedUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateManagedUserInput) => createManagedUser(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminUserQueryKeys.all });
    },
  });
};

export const useManagedUserStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: "ACTIVE" | "DEACTIVATED" }) =>
      status === "DEACTIVATED" ? deactivateManagedUser(userId) : reactivateManagedUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminUserQueryKeys.all });
    },
  });
};

export const useResetManagedUserPassword = (
  onTemporaryPassword: (result: { temporaryPassword: string; user: ManagedUser }) => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    gcTime: 0,
    mutationFn: async (userId: number) => {
      const response = await resetManagedUserPassword(userId);
      onTemporaryPassword({ temporaryPassword: response.temporaryPassword, user: response.user });
      return { message: response.message, user: response.user };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminUserQueryKeys.all });
    },
  });
};

export const useForceManagedUserPasswordChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => forceManagedUserPasswordChange(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminUserQueryKeys.all });
    },
  });
};
