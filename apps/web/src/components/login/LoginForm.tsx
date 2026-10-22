"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import LoadingState from "@/components/states/LoadingState";
import { useCurrentUser, useLogin } from "@/hooks/queries/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoginFormValues, loginSchema } from "./login.schema";
import { getSafePostLoginPath } from "@/lib/auth-redirect";

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const loginMutation = useLogin();
  const currentUserQuery = useCurrentUser();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (currentUserQuery.isSuccess && currentUserQuery.data.user) {
      const returnTo = new URLSearchParams(window.location.search).get(
        "returnTo",
      );
      router.replace(getSafePostLoginPath(returnTo));
    }
  }, [currentUserQuery.data, currentUserQuery.isSuccess, router]);

  const onSubmit = (credentials: LoginFormValues) => {
    loginMutation.mutate(credentials);
  };

  if (
    currentUserQuery.isPending ||
    currentUserQuery.isFetching ||
    (currentUserQuery.isSuccess && currentUserQuery.data.user)
  ) {
    return <LoadingState message="Checking your session..." />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Email
        </label>

        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-500" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>

          <button
            type="button"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Forgot password?
          </button>
        </div>

        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            className="pr-10"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />

          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p
            id="password-error"
            className="mt-1 text-sm text-red-500"
            role="alert"
          >
            {errors.password.message}
          </p>
        )}
      </div>

      {loginMutation.isError && (
        <p className="text-sm text-red-500" role="alert">
          {loginMutation.error.message}
        </p>
      )}

      <div className="flex items-center gap-2">
        <input
          id="remember"
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300"
        />

        <label htmlFor="remember" className="text-sm text-gray-600">
          Remember me
        </label>
      </div>

      <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
};

export default LoginForm;
