import MasterAdminGate from "@/components/auth/MasterAdminGate";
import AdminUsersContent from "@/components/admin/AdminUsersContent";

export default function AdminUsersPage() {
  return <MasterAdminGate><AdminUsersContent /></MasterAdminGate>;
}
