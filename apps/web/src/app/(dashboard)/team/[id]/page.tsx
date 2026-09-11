import { notFound } from "next/navigation";

import { teamMembers } from "@/components/teams/team-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function TeamMemberDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const member = teamMembers.find((member) => member.id === id);

  if (!member) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 text-sm text-gray-500">
            Home / Team / {member.name}
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>

            <Badge>{member.status}</Badge>
          </div>

          <p className="mt-2 text-sm text-gray-500">{member.email}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">Edit</Button>

          <Button variant="destructive">Remove</Button>
        </div>
      </div>

      {/* Member information */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Member Information</h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Name</p>

              <p className="mt-1 font-medium">{member.name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>

              <p className="mt-1 font-medium">{member.email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Role</p>

              <p className="mt-1 font-medium">{member.role}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Status</p>

              <div className="mt-1">
                <Badge>{member.status}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold">Projects</h2>

          <p className="mt-6 text-3xl font-bold">{member.projects}</p>

          <p className="mt-1 text-sm text-gray-500">Assigned projects</p>
        </div>
      </div>

      {/* Projects */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Assigned Projects</h2>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="font-medium">TaskFlow Website</p>

              <p className="text-sm text-gray-500">Website development</p>
            </div>

            <Badge>Active</Badge>
          </div>

          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="font-medium">Mobile App</p>

              <p className="text-sm text-gray-500">Mobile application</p>
            </div>

            <Badge>Active</Badge>
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Activity</h2>

        <div className="mt-6 space-y-5">
          <div>
            <p className="text-sm font-medium">
              {member.name} joined the workspace
            </p>

            <p className="mt-1 text-sm text-gray-500">Aug 20, 2026</p>
          </div>

          <div>
            <p className="text-sm font-medium">Assigned to TaskFlow Website</p>

            <p className="mt-1 text-sm text-gray-500">Aug 25, 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
