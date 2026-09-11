import { Loader2 } from "lucide-react";

type LoadingStateProps = {
  message?: string;
  fullHeight?: boolean;
};
const LoadingState = ({ message, fullHeight }: LoadingStateProps) => {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullHeight ? "min-h-75" : "py-12"
      }`}
    >
      <Loader2
        size={28}
        className="animate-spin text-gray-500"
        aria-hidden="true"
      />

      {message && <p className="mt-3 text-sm text-gray-500">{message}</p>}
    </div>
  );
};

export default LoadingState;
