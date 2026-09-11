import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

const ProfileHeader = () => {
  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-900 text-2xl font-semibold text-white">
            JD
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">John Doe</h2>

            <p className="mt-1 text-sm text-gray-500">john@example.com</p>

            <p className="mt-2 text-sm font-medium text-gray-700">Admin</p>
          </div>
        </div>

        <Button variant="outline">
          <Pencil size={16} />
          Edit
        </Button>
      </div>
    </div>
  );
};

export default ProfileHeader;
