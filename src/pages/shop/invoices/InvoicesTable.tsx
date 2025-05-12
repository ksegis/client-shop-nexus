
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, Printer, Trash } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useInvoices } from "./InvoicesContext";
import { Invoice } from "./types";
import StatusBadge from "./components/StatusBadge";
import EmptyState from "./components/EmptyState";
import DeleteConfirmationDialog from "./components/DeleteConfirmationDialog";

interface InvoicesTableProps {
  onOpenInvoiceDialog: (invoice?: Invoice) => void;
}

export function InvoicesTable({ onOpenInvoiceDialog }: InvoicesTableProps) {
  const { invoices, isLoading, deleteInvoice } = useInvoices();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get current tab from parent component's state via URL or context
  const activeTab = window.location.hash.replace('#', '') || 'unpaid';
  
  // Filter invoices based on the active tab
  const filteredInvoices = invoices.filter(invoice => {
    if (activeTab === 'paid') {
      return invoice.status === 'paid';
    } else if (activeTab === 'unpaid') {
      return ['draft', 'sent', 'overdue'].includes(invoice.status);
    }
    return true; // 'all' tab
  });

  const handleDeleteClick = (id: string) => {
    setSelectedInvoiceId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInvoiceId) return;
    
    setIsDeleting(true);
    try {
      await deleteInvoice(selectedInvoiceId);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedInvoiceId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading invoices...</p>
      </div>
    );
  }

  if (filteredInvoices.length === 0) {
    return <EmptyState onCreateNew={() => onOpenInvoiceDialog()} />;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => {
              const customerName = invoice.profiles ? 
                `${invoice.profiles.first_name || ''} ${invoice.profiles.last_name || ''}`.trim() || 
                invoice.profiles.email : 
                'Unknown';
              
              const vehicleInfo = invoice.vehicles ? 
                `${invoice.vehicles.year} ${invoice.vehicles.make} ${invoice.vehicles.model}` : 
                'Unknown';

              const created = new Date(invoice.created_at).toLocaleDateString();

              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">INV-{invoice.id.substring(0, 8)}</TableCell>
                  <TableCell>{customerName}</TableCell>
                  <TableCell>{vehicleInfo}</TableCell>
                  <TableCell>{invoice.title}</TableCell>
                  <TableCell>{created}</TableCell>
                  <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                  <TableCell><StatusBadge status={invoice.status} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => onOpenInvoiceDialog(invoice)}
                          className="cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {/* Print functionality */}}
                          className="cursor-pointer"
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Print
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(invoice.id)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
}

export default InvoicesTable;
