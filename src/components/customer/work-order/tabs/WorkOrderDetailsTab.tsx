
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

interface WorkOrderDetailsTabProps {
  description: string;
  lineItems?: LineItem[];
  total: number;
}

export const WorkOrderDetailsTab: React.FC<WorkOrderDetailsTabProps> = ({
  description,
  lineItems = [],
  total
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Order Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium">Description</h3>
          <p className="text-gray-600">{description}</p>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Line Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 border-b">
                  <th className="py-2 text-left">Description</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">{item.description}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right">${item.price.toFixed(2)}</td>
                    <td className="py-3 text-right">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="pt-3" colSpan={3}>Total</td>
                  <td className="pt-3 text-right">${total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
