import React from "react";
import { cn } from "../../utils/format";

interface StatusBadgeProps {
  status:
    | "ACTIVE"
    | "EXPIRED"
    | "DAMAGED"
    | "PENDING"
    | "POSITIVE"
    | "NEGATIVE"
    | "CASH"
    | "CREDIT";
  className?: string;
}

const statusConfig = {
  ACTIVE: { bg: "bg-success", text: "text-white", label: "Active" },
  EXPIRED: { bg: "bg-danger", text: "text-white", label: "Expired" },
  DAMAGED: { bg: "bg-warning", text: "text-white", label: "Damaged" },
  PENDING: { bg: "bg-warning", text: "text-white", label: "Pending" },
  POSITIVE: { bg: "bg-success", text: "text-white", label: "Positive" },
  NEGATIVE: { bg: "bg-danger", text: "text-white", label: "Negative" },
  CASH: { bg: "bg-primary", text: "text-white", label: "Cash" },
  CREDIT: { bg: "bg-primary-light", text: "text-primary", label: "Credit" },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
}) => {
  const config = statusConfig[status];

  return (
    <span className={cn("inline text-sm font-normal", "text-text", className)}>
      {config.label}
    </span>
  );
};
