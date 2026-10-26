"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { useEffect, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCurrentUser, useUpdateCurrentUserProfile } from "@/hooks/queries/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";
import { toast } from "sonner";
import ChangePasswordSection from "@/components/settings/ChangePasswordSection";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
const themes = ["light", "dark", "system"] as const;
type ThemeOption = (typeof themes)[number];

const themeLabels: Record<ThemeOption, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

export default function SettingsContent() {
  const currentUserQuery = useCurrentUser();
  const updateProfile = useUpdateCurrentUserProfile();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const themeReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (currentUserQuery.data?.user) {
      reset({ name: currentUserQuery.data.user.name });
    }
  }, [currentUserQuery.data?.user, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile.mutateAsync({ name: values.name.trim() });
      reset({ name: values.name.trim() });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update your profile.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal profile and application preferences.
        </p>
      </header>

      <section aria-labelledby="profile-settings-title">
        <Card>
          <CardHeader>
            <CardTitle id="profile-settings-title">Profile</CardTitle>
            <CardDescription>Update the name shown across TaskFlow. Your email address is read-only.</CardDescription>
          </CardHeader>
          <CardContent>
            {currentUserQuery.isPending ? (
              <LoadingState message="Loading your profile..." />
            ) : currentUserQuery.isError ? (
              <ErrorState
                title="Profile unavailable"
                description="We couldn't load your account details. Try again."
                onRetry={() => void currentUserQuery.refetch()}
              />
            ) : currentUserQuery.data ? (
              <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-5" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="min-w-0">
                    <label htmlFor="settings-name" className="mb-2 block text-sm font-medium text-foreground">
                      Name
                    </label>
                    <Input
                      id="settings-name"
                      autoComplete="name"
                      maxLength={100}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "settings-name-error" : undefined}
                      disabled={isSubmitting || updateProfile.isPending}
                      {...register("name")}
                    />
                    {errors.name && (
                      <p id="settings-name-error" role="alert" className="mt-1 text-sm text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="settings-email" className="mb-2 block text-sm font-medium text-foreground">
                      Email
                    </label>
                    <Input id="settings-email" type="email" value={currentUserQuery.data.user.email} readOnly />
                    <p className="mt-1 text-xs text-muted-foreground">Email changes are not available yet.</p>
                  </div>
                </div>
                {updateProfile.isError && (
                  <p role="alert" className="text-sm text-destructive">
                    {updateProfile.error.message || "Unable to update your profile."}
                  </p>
                )}
                <Button type="submit" disabled={!isDirty || isSubmitting || updateProfile.isPending}>
                  {updateProfile.isPending ? "Saving..." : "Save profile"}
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="appearance-settings-title">
        <Card>
          <CardHeader>
            <CardTitle id="appearance-settings-title">Appearance</CardTitle>
            <CardDescription>Choose a theme for this browser. System follows your device preference.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex w-full flex-wrap gap-2 sm:max-w-md" role="group" aria-label="Color theme">
              {themes.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={themeReady && theme === option ? "default" : "outline"}
                  className="min-w-24 flex-1 capitalize"
                  aria-pressed={themeReady && theme === option}
                  disabled={!themeReady}
                  onClick={() => setTheme(option)}
                >
                  {themeLabels[option]}
                </Button>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
              {themeReady
                ? `Currently displaying ${resolvedTheme ?? "your"} appearance.`
                : "Loading saved appearance..."}
            </p>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="notification-settings-title">
        <Card>
          <CardHeader>
            <CardTitle id="notification-settings-title">Notifications</CardTitle>
              <CardDescription>TaskFlow&apos;s in-app notifications remain available from the header.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Notification preferences are not currently configurable. No notification settings are saved here.
            </p>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="security-settings-title">
        <ChangePasswordSection />
      </section>
    </div>
  );
}
