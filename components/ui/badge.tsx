import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "fresh" | "expiring" | "expired" | "default" | "outline";
  className?: string;
  children: React.ReactNode;
}

const variantClass = {
  fresh: "bg-green-100 text-green-800 border-green-200",
  expiring: "bg-yellow-100 text-yellow-800 border-yellow-200",
  expired: "bg-red-100 text-red-800 border-red-200",
  default: "bg-gray-100 text-gray-800 border-gray-200",
  outline: "bg-transparent border-gray-300 text-gray-700",
};

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        variantClass[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
