"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createManagedUser, deactivateManagedUser, getManagedUsers, reactivateManagedUser, type CreateManagedUserInput, type ManagedUsersParams } from "@/lib/api/admin.api";

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
