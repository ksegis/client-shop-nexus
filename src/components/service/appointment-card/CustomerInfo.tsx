
import { AlertCircle } from 'lucide-react';

interface CustomerInfoProps {
  customerInfo?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  showCustomerInfo: boolean;
}

export const CustomerInfo = ({ customerInfo, showCustomerInfo }: CustomerInfoProps) => {
  if (!showCustomerInfo || !customerInfo) {
    return null;
  }
  
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <AlertCircle className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">Customer:</span>
      </div>
      <p className="text-sm">
        {customerInfo.first_name} {customerInfo.last_name} 
        <span className="text-muted-foreground"> • {customerInfo.email}</span>
      </p>
    </div>
  );
};
