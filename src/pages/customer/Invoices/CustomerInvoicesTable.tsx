
import { useState } from 'react';
import { useCustomerInvoices } from './CustomerInvoicesContext';
import { format, isValid } from 'date-fns';
import { Invoice } from '@/pages/shop/invoices/types';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, FileText } from 'lucide-react';
import CustomerInvoiceDetailDialog from './CustomerInvoiceDetailDialog';
import StatusBadge from '@/pages/shop/invoices/components/StatusBadge';
import EmptyState from './components/EmptyState';

export default function CustomerInvoicesTable() {
  const { invoices, isLoading } = useCustomerInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const handleOpenDetailDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedInvoice(null);
  };

  const safeFormatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid date';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg text-gray-500">Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (!invoices.length) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.title}</TableCell>
                <TableCell>
                  <StatusBadge status={invoice.status} />
                </TableCell>
                <TableCell>{safeFormatDate(invoice.created_at)}</TableCell>
                <TableCell>
                  {invoice.vehicles ? 
                    `${invoice.vehicles.year} ${invoice.vehicles.make} ${invoice.vehicles.model}` : 
                    'N/A'}
                </TableCell>
                <TableCell>${invoice.total_amount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDetailDialog(invoice)}
                    title="View Invoice Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedInvoice && (
        <CustomerInvoiceDetailDialog
          open={detailDialogOpen}
          onClose={handleCloseDetailDialog}
          invoice={selectedInvoice}
        />
      )}
    </>
  );
}
