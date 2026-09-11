import ChangePasswordForm from "@/components/profile/ChangePasswordForm";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileInformation from "@/components/profile/ProfileInformation";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage your personal information and account details.
        </p>
      </div>

      {/* Profile */}
      <ProfileHeader />

      {/* Personal Information */}
      <ProfileInformation />

      {/* Security */}
      <ChangePasswordForm />
    </div>
  );
}
