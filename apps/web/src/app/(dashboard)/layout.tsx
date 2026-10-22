import AppLayout from "./AppLayout";
import DashboardAuthGate from "@/components/auth/DashboardAuthGate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthGate>
      <AppLayout>{children}</AppLayout>
    </DashboardAuthGate>
  );
}
