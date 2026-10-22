import type { Metadata } from "next";
import { Suspense } from "react";
import LoadingState from "@/components/states/LoadingState";
import InvitationAcceptanceContent from "@/components/invitations/InvitationAcceptanceContent";

export const metadata: Metadata = {
  title: "Project invitation | TaskFlow",
  referrer: "no-referrer",
};

export default function InvitationAcceptancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-xl border bg-white p-6 shadow-sm">
        <Suspense fallback={<LoadingState message="Loading invitation..." />}>
          <InvitationAcceptanceContent />
        </Suspense>
      </div>
    </main>
  );
}
