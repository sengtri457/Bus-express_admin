import { Badge } from "@/components/ui/badge";

type StatusMap = Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" }>;

const STATUS_CONFIG: StatusMap = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "neutral" },
  suspended: { label: "Suspended", variant: "danger" },
  maintenance: { label: "Maintenance", variant: "warning" },
  retired: { label: "Retired", variant: "neutral" },
  cancelled: { label: "Cancelled", variant: "danger" },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status.toLowerCase()] ?? {
    label: status,
    variant: "neutral" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
