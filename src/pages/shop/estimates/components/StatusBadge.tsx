
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";

type EstimateStatus = Database["public"]["Enums"]["estimate_status"];

interface StatusBadgeProps {
  status: EstimateStatus;
}

const getStatusStyles = (status: EstimateStatus) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "approved":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "declined":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    case "completed":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge className={cn("font-medium capitalize", getStatusStyles(status))}>
      {status}
    </Badge>
  );
}

export default StatusBadge;
