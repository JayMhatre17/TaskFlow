import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCurrentUser,
  changePassword,
  login,
  logout,
  updateCurrentUserProfile,
} from "@/lib/api/auth.api";

export const authQueryKeys = {
  currentUser: ["auth", "current-user"] as const,
};

export const useCurrentUser = () =>
  useQuery({
    queryKey: authQueryKeys.currentUser,
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 60_000,
  });

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      queryClient.setQueryData(authQueryKeys.currentUser, {
        user: response.user,
      });
    },
  });
};

export const useLogout = () =>
  useMutation({
    mutationFn: logout,
  });

export const useUpdateCurrentUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCurrentUserProfile,
    onSuccess: (response) => {
      queryClient.setQueryData(authQueryKeys.currentUser, response);
    },
  });
};

export const useChangePassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: changePassword,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser });
    },
  });
};
