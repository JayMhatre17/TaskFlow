import TemporaryPasswordChangeContent from "@/components/auth/TemporaryPasswordChangeContent";

export default function ChangePasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
      <div className="w-full max-w-2xl space-y-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-foreground">TaskFlow</h1>
          <p className="mt-2 text-sm text-muted-foreground">Secure your account to continue.</p>
        </header>
        <TemporaryPasswordChangeContent />
      </div>
    </main>
  );
}
