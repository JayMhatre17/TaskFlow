import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ChangePasswordForm = () => {
  return (
    <div className="rounded-xl border bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Security</h2>

        <p className="mt-1 text-sm text-gray-500">
          Manage your password and account security.
        </p>
      </div>

      <div className="mt-6 max-w-xl space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Current Password
          </label>

          <Input type="password" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            New Password
          </label>

          <Input type="password" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Confirm New Password
          </label>

          <Input type="password" />
        </div>

        <Button>Change Password</Button>
      </div>
    </div>
  );
};

export default ChangePasswordForm;
