
import { Badge } from "@/components/ui/badge";
import { Repeat } from "lucide-react";

interface CoreIndicatorBadgeProps {
  coreCharge: number | null;
  size?: "sm" | "default";
}

export const CoreIndicatorBadge = ({ coreCharge, size = "default" }: CoreIndicatorBadgeProps) => {
  if (!coreCharge || coreCharge <= 0) {
    return null;
  }

  return (
    <Badge 
      variant="outline" 
      className="border-blue-500 text-blue-700 bg-blue-50"
      size={size}
    >
      <Repeat className="h-3 w-3 mr-1" />
      Core: ${coreCharge.toFixed(2)}
    </Badge>
  );
};
