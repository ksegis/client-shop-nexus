
import { Badge } from "@/components/ui/badge";
import { Repeat } from "lucide-react";

interface CoreIndicatorBadgeProps {
  coreCharge: number | null;
}

export const CoreIndicatorBadge = ({ coreCharge }: CoreIndicatorBadgeProps) => {
  if (!coreCharge || coreCharge <= 0) {
    return null;
  }

  return (
    <Badge 
      variant="outline" 
      className="border-blue-500 text-blue-700 bg-blue-50 text-xs"
    >
      <Repeat className="h-3 w-3 mr-1" />
      Core: ${coreCharge.toFixed(2)}
    </Badge>
  );
};
