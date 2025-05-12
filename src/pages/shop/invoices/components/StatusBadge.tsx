
import { Badge } from "@/components/ui/badge";
import { InvoiceStatus } from "../types";

interface StatusBadgeProps {
  status: InvoiceStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case "draft":
        return "bg-gray-200 text-gray-800 hover:bg-gray-200";
      case "sent":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "paid":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "void":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "overdue":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      default:
        return "bg-gray-200 text-gray-800 hover:bg-gray-200";
    }
  };
  
  return (
    <Badge variant="outline" className={`${getStatusColor(status)}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
