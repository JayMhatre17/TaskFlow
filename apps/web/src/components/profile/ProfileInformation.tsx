const ProfileInformation = () => {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Personal Information
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Your personal account information.
        </p>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Full Name</p>
          <p className="mt-1 font-medium text-foreground">John Doe</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="mt-1 font-medium text-foreground">john@example.com</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Role</p>
          <p className="mt-1 font-medium text-foreground">Admin</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Member Since</p>
          <p className="mt-1 font-medium text-foreground">August 2026</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileInformation;
