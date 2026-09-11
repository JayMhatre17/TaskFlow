import { type LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  description?: string;
};

const StatsCard = ({
  label,
  value,
  icon: Icon,
  description,
}: StatCardProps) => {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>

        {Icon && (
          <Icon size={20} className="text-gray-400" aria-hidden="true" />
        )}
      </div>

      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>

      {description && (
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
};

export default StatsCard;
