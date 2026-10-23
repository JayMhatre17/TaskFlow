import TrashContent from "@/components/trash/TrashContent";

export default function TrashPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Trash</h1>
        <p className="mt-1 text-sm text-gray-500">Review and restore deleted projects and tasks.</p>
      </header>
      <TrashContent />
    </div>
  );
}
