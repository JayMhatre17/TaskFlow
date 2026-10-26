import { type LucideIcon } from "lucide-react";
import Link from "next/link";

type StatCardProps = {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  description?: string;
  href?: string;
};

const StatsCard = ({
  label,
  value,
  icon: Icon,
  description,
  href,
}: StatCardProps) => {
  const content = (
    <div className="min-w-0 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="min-w-0 break-words text-sm text-muted-foreground">{label}</p>

        {Icon && (
          <Icon size={20} className="text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>

      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );

  return href ? (
    <Link
      href={href}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`${label}: ${value}. View matching records.`}
    >
      {content}
    </Link>
  ) : (
    content
  );
};

export default StatsCard;
