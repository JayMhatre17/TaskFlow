const ProfileInformation = () => {
  return (
    <div className="rounded-xl border bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Personal Information
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Your personal account information.
        </p>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm text-gray-500">Full Name</p>
          <p className="mt-1 font-medium text-gray-900">John Doe</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Email</p>
          <p className="mt-1 font-medium text-gray-900">john@example.com</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Role</p>
          <p className="mt-1 font-medium text-gray-900">Admin</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Member Since</p>
          <p className="mt-1 font-medium text-gray-900">August 2026</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileInformation;
