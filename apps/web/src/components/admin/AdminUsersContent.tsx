"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useCreateManagedUser,
  useForceManagedUserPasswordChange,
  useManagedUserStatusMutation,
  useManagedUsers,
  useResetManagedUserPassword,
} from "@/hooks/queries/useAdminUsers";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";
import type { ManagedUser } from "@/lib/api/admin.api";
import { toast } from "sonner";

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  temporaryPassword: z.string().min(8, "Use at least 8 characters").max(128, "Use no more than 128 characters"),
});
type CreateUserValues = z.infer<typeof createUserSchema>;
const DEFAULT_TEMPORARY_PASSWORD = "Welcome@123";
type PasswordAction = { user: ManagedUser; action: "RESET" | "FORCE_CHANGE" };
type ResetPasswordResult = { user: ManagedUser; temporaryPassword: string };

export default function AdminUsersContent() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const users = useManagedUsers({ page, limit: 10, search: search.trim() || undefined });
  const createUser = useCreateManagedUser();
  const updateUserStatus = useManagedUserStatusMutation();
  const forcePasswordChange = useForceManagedUserPasswordChange();
  const [userToDeactivate, setUserToDeactivate] = useState<ManagedUser | null>(null);
  const [passwordAction, setPasswordAction] = useState<PasswordAction | null>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<ResetPasswordResult | null>(null);
  const pendingResetResult = useRef<ResetPasswordResult | null>(null);
  const mounted = useRef(false);
  const resetPassword = useResetManagedUserPassword((result) => {
    if (mounted.current) pendingResetResult.current = result;
  });
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", temporaryPassword: DEFAULT_TEMPORARY_PASSWORD },
  });

  const submit = async (values: CreateUserValues) => {
    try {
      await createUser.mutateAsync(values);
      reset({ name: "", email: "", temporaryPassword: "" });
      setPage(1);
    } catch {
      // The safe API message is rendered below the form; credentials are not logged.
    }
  };
  const pending = isSubmitting || createUser.isPending;
  const statusPending = updateUserStatus.isPending;
  const passwordActionPending = resetPassword.isPending || forcePasswordChange.isPending;
  const fieldError = (field: keyof CreateUserValues) => errors[field]?.message;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      pendingResetResult.current = null;
    };
  }, []);

  const confirmDeactivation = async () => {
    if (!userToDeactivate) return;
    try {
      const response = await updateUserStatus.mutateAsync({ userId: userToDeactivate.id, status: "DEACTIVATED" });
      toast.success(response.message);
      setUserToDeactivate(null);
    } catch {
      // Show the safe API error in the accounts panel.
    }
  };

  const reactivate = async (user: ManagedUser) => {
    try {
      const response = await updateUserStatus.mutateAsync({ userId: user.id, status: "ACTIVE" });
      toast.success(response.message);
    } catch {
      // Show the safe API error in the accounts panel.
    }
  };

  const confirmPasswordAction = async () => {
    if (!passwordAction) return;
    try {
      if (passwordAction.action === "RESET") {
        await resetPassword.mutateAsync(passwordAction.user.id);
        const result = pendingResetResult.current;
        pendingResetResult.current = null;
        setPasswordAction(null);
        if (result) setResetPasswordResult(result);
      } else {
        const response = await forcePasswordChange.mutateAsync(passwordAction.user.id);
        toast.success(response.message);
        setPasswordAction(null);
      }
    } catch {
      // Safe API errors are shown in the confirmation dialog.
    }
  };

  const copyTemporaryPassword = async () => {
    if (!resetPasswordResult) return;
    try {
      await navigator.clipboard.writeText(resetPasswordResult.temporaryPassword);
      toast.success("Temporary password copied. Share it securely.");
    } catch {
      toast.error("Could not copy the temporary password. Select and copy it manually.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">User management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create standard accounts and review account status.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Create a user</CardTitle>
          <CardDescription>New accounts must replace the temporary password before accessing TaskFlow.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2" noValidate>
            <div>
              <label htmlFor="admin-user-name" className="mb-2 block text-sm font-medium">Name</label>
              <Input id="admin-user-name" maxLength={100} disabled={pending} aria-invalid={Boolean(fieldError("name"))} {...register("name")} />
              {fieldError("name") && <p role="alert" className="mt-1 text-sm text-destructive">{fieldError("name")}</p>}
            </div>
            <div>
              <label htmlFor="admin-user-email" className="mb-2 block text-sm font-medium">Email</label>
              <Input id="admin-user-email" type="email" autoComplete="email" maxLength={254} disabled={pending} aria-invalid={Boolean(fieldError("email"))} {...register("email")} />
              {fieldError("email") && <p role="alert" className="mt-1 text-sm text-destructive">{fieldError("email")}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="admin-user-temporary-password" className="mb-2 block text-sm font-medium">Temporary password</label>
              <Input id="admin-user-temporary-password" type="password" autoComplete="new-password" maxLength={128} disabled={pending} aria-invalid={Boolean(fieldError("temporaryPassword"))} {...register("temporaryPassword")} />
              {fieldError("temporaryPassword") && <p role="alert" className="mt-1 text-sm text-destructive">{fieldError("temporaryPassword")}</p>}
              <p className="mt-1 text-xs text-muted-foreground">Share it with the user through a private channel. TaskFlow does not email temporary passwords.</p>
            </div>
            {createUser.isError && (
              <p role="alert" className="text-sm text-destructive sm:col-span-2">
                {createUser.error instanceof ApiError ? createUser.error.message : "Unable to create the account. Try again."}
              </p>
            )}
            {createUser.isSuccess && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400 sm:col-span-2">User created. The temporary password is not retained by the form.</p>}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending}>{pending ? "Creating user..." : "Create user"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>{users.data ? `${users.data.pagination.total} accounts` : "Search and review user accounts."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {updateUserStatus.isError && (
            <p role="alert" className="text-sm text-destructive">
              {updateUserStatus.error instanceof ApiError ? updateUserStatus.error.message : "Unable to update this account. Try again."}
            </p>
          )}
          <div className="max-w-md">
            <label htmlFor="admin-user-search" className="mb-2 block text-sm font-medium">Search users</label>
            <Input id="admin-user-search" value={search} maxLength={100} placeholder="Name or email" onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          </div>
          {users.isPending ? <LoadingState message="Loading users..." /> : users.isError ? (
            <ErrorState title="Users unavailable" description="We couldn't load user accounts." onRetry={() => void users.refetch()} />
          ) : users.data?.data.length ? (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="border-b bg-muted/50 text-muted-foreground"><tr><th className="px-4 py-3 font-medium">User</th><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Password setup</th><th className="px-4 py-3 font-medium">Created</th><th className="px-4 py-3 font-medium">Actions</th></tr></thead>
                  <tbody className="divide-y">
                    {users.data.data.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3"><p className="font-medium text-foreground">{user.name}</p><p className="text-muted-foreground">{user.email}</p></td>
                        <td className="px-4 py-3">{user.role === "ADMIN" ? "Administrator" : "User"}</td>
                        <td className="px-4 py-3">{user.status === "ACTIVE" ? "Active" : user.status === "DEACTIVATED" ? "Inactive" : user.status.replaceAll("_", " ")}</td>
                        <td className="px-4 py-3">{user.mustChangePassword ? "Temporary password" : "Complete"}</td>
                        <td className="px-4 py-3">{new Date(user.createdAt).toISOString().slice(0, 10)}</td>
                        <td className="px-4 py-3">
                          {user.role === "USER" && user.status === "ACTIVE" && (
                            <div className="flex flex-wrap gap-2">
                              <Button variant="outline" size="sm" disabled={statusPending || passwordActionPending} onClick={() => setPasswordAction({ user, action: "RESET" })}>
                                Reset password
                              </Button>
                              <Button variant="outline" size="sm" disabled={statusPending || passwordActionPending} onClick={() => setPasswordAction({ user, action: "FORCE_CHANGE" })}>
                                Force password change
                              </Button>
                              <Button variant="outline" size="sm" disabled={statusPending || passwordActionPending} onClick={() => setUserToDeactivate(user)}>
                                Deactivate
                              </Button>
                            </div>
                          )}
                          {user.role === "USER" && user.status === "DEACTIVATED" && (
                            <Button variant="outline" size="sm" disabled={statusPending} onClick={() => void reactivate(user)}>
                              {statusPending ? "Updating..." : "Reactivate"}
                            </Button>
                          )}
                          {(user.role !== "USER" || (user.status !== "ACTIVE" && user.status !== "DEACTIVATED")) && <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">Page {users.data.pagination.page} of {Math.max(users.data.pagination.totalPages, 1)}</p>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={page <= 1 || users.isFetching} onClick={() => setPage((value) => value - 1)}>Previous</Button>
                  <Button variant="outline" disabled={page >= users.data.pagination.totalPages || users.isFetching} onClick={() => setPage((value) => value + 1)}>Next</Button>
                </div>
              </div>
            </>
          ) : <EmptyState iconType="users" title="No users found" description={search ? "Try a different name or email." : "No accounts have been created yet."} />}
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(userToDeactivate)}
        onOpenChange={(open) => {
          if (!open && !statusPending) setUserToDeactivate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate this account?</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDeactivate?.name} will lose access to TaskFlow. Their projects, tasks, memberships, and history will be retained. They can be reactivated later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {updateUserStatus.isError && (
            <p role="alert" className="text-sm text-destructive">
              {updateUserStatus.error instanceof ApiError ? updateUserStatus.error.message : "Unable to deactivate this account. Try again."}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusPending}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={statusPending} onClick={() => void confirmDeactivation()}>
              {statusPending ? "Deactivating..." : "Deactivate account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(passwordAction)}
        onOpenChange={(open) => {
          if (!open && !passwordActionPending) {
            setPasswordAction(null);
            resetPassword.reset();
            forcePasswordChange.reset();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {passwordAction?.action === "RESET" ? "Reset this user's password?" : "Require a password change?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {passwordAction?.action === "RESET"
                ? `A new temporary password will be generated for ${passwordAction.user.name}. Their current sessions will be revoked, and they must change the temporary password at their next login.`
                : `${passwordAction?.user.name}'s password will remain unchanged. Their current sessions will be revoked, and they must change their password at their next login.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {resetPassword.isError && (
            <p role="alert" className="text-sm text-destructive">
              {resetPassword.error instanceof ApiError ? resetPassword.error.message : "Unable to reset this password. Try again."}
            </p>
          )}
          {forcePasswordChange.isError && (
            <p role="alert" className="text-sm text-destructive">
              {forcePasswordChange.error instanceof ApiError ? forcePasswordChange.error.message : "Unable to require a password change. Try again."}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={passwordActionPending}>Cancel</AlertDialogCancel>
            <Button disabled={passwordActionPending} onClick={() => void confirmPasswordAction()}>
              {passwordActionPending
                ? "Updating..."
                : passwordAction?.action === "RESET"
                  ? "Reset password"
                  : "Require password change"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={Boolean(resetPasswordResult)}
        onOpenChange={(open) => {
          if (!open) setResetPasswordResult(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Temporary password for {resetPasswordResult?.user.name}</DialogTitle>
            <DialogDescription>
              This password is shown once. Share it with the user through a secure private channel. They will need to change it after logging in.
            </DialogDescription>
          </DialogHeader>
          <output aria-label="Generated temporary password" className="block break-all rounded-md border bg-muted px-3 py-2 font-mono text-sm text-foreground">
            {resetPasswordResult?.temporaryPassword}
          </output>
          <DialogFooter>
            <Button variant="outline" onClick={() => void copyTemporaryPassword()}>
              <Copy aria-hidden="true" />
              Copy password
            </Button>
            <Button onClick={() => setResetPasswordResult(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
