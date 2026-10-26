import DashboardContent from "@/components/dashboard/DashboardContent";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back. Here is what is happening with your workspace.
        </p>
      </div>

      <DashboardContent />
    </div>
  );
}
