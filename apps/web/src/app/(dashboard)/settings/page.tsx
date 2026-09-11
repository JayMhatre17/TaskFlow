import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage your workspace and account settings.
        </p>
      </div>

      {/* Settings */}
      <div className="rounded-xl border bg-white">
        <Tabs defaultValue="general">
          <div className="border-b px-6">
            <TabsList className="h-12">
              <TabsTrigger value="general">General</TabsTrigger>

              <TabsTrigger value="account">Account</TabsTrigger>

              <TabsTrigger value="notifications">Notifications</TabsTrigger>

              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
          </div>

          {/* General */}
          <TabsContent value="general" className="p-6">
            <div>
              <h2 className="text-lg font-semibold">General Settings</h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage your workspace information.
              </p>
            </div>

            <div className="mt-6 max-w-xl space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Workspace Name
                </label>

                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  defaultValue="TaskFlow"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Workspace Description
                </label>

                <textarea
                  className="min-h-24 w-full rounded-md border p-3 text-sm"
                  defaultValue="TaskFlow workspace management platform."
                />
              </div>

              <button className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
                Save Changes
              </button>
            </div>
          </TabsContent>

          {/* Account */}
          <TabsContent value="account" className="p-6">
            <div>
              <h2 className="text-lg font-semibold">Account Settings</h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage your personal account information.
              </p>
            </div>

            <div className="mt-6 max-w-xl space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium">Name</label>

                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  defaultValue="John Doe"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>

                <input
                  type="email"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  defaultValue="john@example.com"
                />
              </div>

              <button className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
                Save Changes
              </button>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="p-6">
            <div>
              <h2 className="text-lg font-semibold">Notifications</h2>

              <p className="mt-1 text-sm text-gray-500">
                Choose which notifications you want to receive.
              </p>
            </div>

            <div className="mt-6 max-w-xl space-y-5">
              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Task Updates</p>

                  <p className="text-sm text-gray-500">
                    Get notified when tasks are updated.
                  </p>
                </div>

                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Project Updates</p>

                  <p className="text-sm text-gray-500">
                    Get notified about project changes.
                  </p>
                </div>

                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Team Activity</p>

                  <p className="text-sm text-gray-500">
                    Get notified about team activity.
                  </p>
                </div>

                <input type="checkbox" className="h-4 w-4" />
              </label>

              <button className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
                Save Preferences
              </button>
            </div>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="p-6">
            <div>
              <h2 className="text-lg font-semibold">Security</h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage your password and account security.
              </p>
            </div>

            <div className="mt-6 max-w-xl space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Current Password
                </label>

                <input
                  type="password"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  New Password
                </label>

                <input
                  type="password"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Confirm Password
                </label>

                <input
                  type="password"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              <button className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
                Update Password
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
