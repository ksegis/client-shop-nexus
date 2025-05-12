
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface LineItem {
  id: string;
  part_number?: string;
  description: string;
  quantity: number;
  price: number;
  approved: boolean;
}

interface EstimateLineItemsProps {
  lineItems: LineItem[];
  toggleItemApproval: (itemId: string) => void;
  changesAllowed: boolean;
  subtotal: number;
  tax: number;
  total: number;
}

const EstimateLineItems = ({
  lineItems,
  toggleItemApproval,
  changesAllowed,
  subtotal,
  tax,
  total
}: EstimateLineItemsProps) => {
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Part #</TableHead>
            <TableHead className="w-full">Description</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lineItems.length > 0 ? (
            lineItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Checkbox 
                    checked={item.approved}
                    onCheckedChange={() => toggleItemApproval(item.id)}
                    disabled={!changesAllowed}
                  />
                </TableCell>
                <TableCell className="font-medium">{item.part_number || '-'}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                <TableCell className="text-right">${(item.quantity * item.price).toFixed(2)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                No line items found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      <div className="mt-6 flex justify-end">
        <div className="w-1/3 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="font-semibold">Total:</span>
            <span className="font-semibold">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default EstimateLineItems;
