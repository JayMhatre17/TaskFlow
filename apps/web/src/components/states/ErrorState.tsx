import { AlertCircle, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  onRetry?: () => void;
};

const ErrorState = ({
  icon,
  title = "Something went wrong",
  description = "We couldn't load this content. Please try again.",
  action,
  onRetry,
}: ErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon ?? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <AlertCircle size={24} />
        </div>
      )}

      <h3 className="text-base font-semibold text-gray-900">{title}</h3>

      <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>

      {action ? (
        <div className="mt-4">{action}</div>
      ) : (
        onRetry && (
          <Button variant="outline" className="mt-4" onClick={onRetry}>
            <RefreshCw size={16} />
            Try again
          </Button>
        )
      )}
    </div>
  );
};

export default ErrorState;
