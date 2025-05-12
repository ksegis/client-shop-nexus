import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Invoice } from "@/pages/shop/invoices/types";
import { format, isValid } from "date-fns";
import StatusBadge from "@/pages/shop/invoices/components/StatusBadge";

interface CustomerInvoiceDetailDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: Invoice;
}

export default function CustomerInvoiceDetailDialog({ 
  open, 
  onClose, 
  invoice 
}: CustomerInvoiceDetailDialogProps) {
  const safeFormatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isValid(date) ? format(date, 'PPP') : 'Invalid date';
  };

  const vehicleInfo = invoice.vehicles 
    ? `${invoice.vehicles.year} ${invoice.vehicles.make} ${invoice.vehicles.model}` 
    : 'Not specified';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice: {invoice.title}</span>
            <StatusBadge status={invoice.status} />
          </DialogTitle>
          <DialogDescription>
            Created on {safeFormatDate(invoice.created_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Invoice Details</h3>
              <div className="mt-2 space-y-1">
                <p><span className="font-medium">Vehicle:</span> {vehicleInfo}</p>
                <p><span className="font-medium">Total Amount:</span> ${invoice.total_amount.toFixed(2)}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Payment Status</h3>
              <div className="mt-2 space-y-1">
                <p>
                  <span className="font-medium">Status:</span> {invoice.status}
                </p>
                {invoice.status === 'draft' || invoice.status === 'sent' && (
                  <p className="text-sm text-amber-600">
                    Please contact the shop to process payment.
                  </p>
                )}
                {invoice.status === 'paid' && (
                  <p className="text-sm text-green-600">
                    This invoice has been paid. Thank you!
                  </p>
                )}
                {invoice.status === 'overdue' && (
                  <p className="text-sm text-red-600">
                    This invoice is overdue. Please contact the shop immediately.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-2 text-sm text-gray-700">
              {invoice.description || 'No description provided.'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
