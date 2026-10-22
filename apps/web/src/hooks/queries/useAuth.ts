import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, login, logout } from "@/lib/api/auth.api";

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
