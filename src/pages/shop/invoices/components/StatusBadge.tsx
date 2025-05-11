
import { Badge } from "@/components/ui/badge";
import { InvoiceStatus } from "../types";

interface StatusBadgeProps {
  status: InvoiceStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  
  switch (status) {
    case "paid":
      variant = "default"; // Green
      break;
    case "pending":
      variant = "secondary"; // Gray
      break;
    case "overdue":
      variant = "destructive"; // Red
      break;
    case "draft":
      variant = "outline"; // Outline
      break;
    default:
      variant = "default";
  }
  
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}

export default StatusBadge;
