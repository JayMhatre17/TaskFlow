import AddMemberForm from "@/components/teams/AddMemberForm";

export default function AddMemberPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Team Member</h1>

        <p className="mt-1 text-sm text-gray-500">
          Add a new member to your workspace.
        </p>
      </div>

      <div className="max-w-3xl rounded-xl border bg-white p-6">
        <AddMemberForm />
      </div>
    </div>
  );
}
