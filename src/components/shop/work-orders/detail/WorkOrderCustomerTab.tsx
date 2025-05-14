
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface WorkOrderCustomerTabProps {
  workOrder: any;
}

export const WorkOrderCustomerTab: React.FC<WorkOrderCustomerTabProps> = ({ workOrder }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Customer</h3>
            <p>John Doe</p>
            <p className="text-sm text-muted-foreground">john.doe@example.com</p>
            <p className="text-sm text-muted-foreground">(555) 123-4567</p>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" />
              Send Message
            </Button>
            
            <Button variant="outline" asChild>
              <Link to={`/shop/customers/details/${workOrder.customer_id}`}>
                View Customer Details
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
