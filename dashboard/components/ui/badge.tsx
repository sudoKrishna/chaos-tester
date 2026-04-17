import * as React from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "critical" | "high" | "medium" | "info";
};

const variantStyles: Record<string, string> = {
  default: "bg-gray-100 text-gray-800",
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  info: "bg-blue-100 text-blue-700",
};

export function Badge({
  className = "",
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-md ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
}