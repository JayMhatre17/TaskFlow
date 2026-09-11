import LoginForm from "@/components/login/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">TaskFlow</h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage your workspace with ease.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Welcome back
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Sign in to your account to continue.
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
