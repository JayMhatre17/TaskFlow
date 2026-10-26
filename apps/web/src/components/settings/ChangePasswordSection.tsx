"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useChangePassword } from "@/hooks/queries/useAuth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(128, "Use no more than 128 characters"),
    confirmNewPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"],
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

const ChangePasswordSection = ({ forced = false }: { forced?: boolean }) => {
  const mutation = useChangePassword();
  const router = useRouter();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const submit = async (values: ChangePasswordValues) => {
    try {
      await mutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmation(false);
      toast.success(forced ? "Password updated. Your account is ready." : "Password updated. Other signed-in sessions were revoked.");
      if (forced) router.replace("/dashboard");
    } catch {
      // The mutation error is shown below the form without logging credentials.
    }
  };

  const pending = isSubmitting || mutation.isPending;
  const fields = [
    {
      id: "current-password",
      label: "Current password",
      autoComplete: "current-password",
      visible: showCurrentPassword,
      setVisible: setShowCurrentPassword,
      error: errors.currentPassword?.message,
      registration: register("currentPassword"),
    },
    {
      id: "new-password",
      label: "New password",
      autoComplete: "new-password",
      visible: showNewPassword,
      setVisible: setShowNewPassword,
      error: errors.newPassword?.message,
      registration: register("newPassword"),
    },
    {
      id: "confirm-new-password",
      label: "Confirm new password",
      autoComplete: "new-password",
      visible: showConfirmation,
      setVisible: setShowConfirmation,
      error: errors.confirmNewPassword?.message,
      registration: register("confirmNewPassword"),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle id="security-settings-title">{forced ? "Set a new password" : "Security"}</CardTitle>
        <CardDescription>
          {forced
            ? "Your administrator provided a temporary password. Choose a new password to continue using TaskFlow."
            : "Change your password. Other active sessions will be signed out; this session will stay active."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(submit)} className="max-w-xl space-y-5" noValidate>
          {fields.map((field) => (
            <div key={field.id}>
              <label htmlFor={field.id} className="mb-2 block text-sm font-medium text-foreground">
                {field.label}
              </label>
              <div className="relative">
                <Input
                  id={field.id}
                  type={field.visible ? "text" : "password"}
                  autoComplete={field.autoComplete}
                  maxLength={field.id === "current-password" ? undefined : 128}
                  className="pr-12"
                  aria-invalid={Boolean(field.error)}
                  aria-describedby={field.error ? `${field.id}-error` : undefined}
                  disabled={pending}
                  {...field.registration}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-1"
                  aria-label={`${field.visible ? "Hide" : "Show"} ${field.label.toLowerCase()}`}
                  aria-pressed={field.visible}
                  disabled={pending}
                  onClick={() => field.setVisible((visible) => !visible)}
                >
                  {field.visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </Button>
              </div>
              {field.error && (
                <p id={`${field.id}-error`} role="alert" className="mt-1 text-sm text-destructive">
                  {field.error}
                </p>
              )}
            </div>
          ))}

          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {mutation.error instanceof ApiError
                ? mutation.error.message
                : "Unable to update your password. Check your connection and try again."}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Updating password..." : forced ? "Set password and continue" : "Change password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChangePasswordSection;
