
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, Trash, FileText, Hammer } from "lucide-react";
import { Link } from "react-router-dom";
import { useEstimates } from "./EstimatesContext";
import { Button } from "@/components/ui/button";
import StatusBadge from "./components/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import DeleteConfirmationDialog from "./components/DeleteConfirmationDialog";
import { EstimateToWorkOrderDialog } from "../work-orders/EstimateToWorkOrderDialog";

interface EstimatesTableProps {
  onEdit: (estimate: any) => void;
}

export function EstimatesTable({ onEdit }: EstimatesTableProps) {
  const { estimates, isLoading, error, deleteEstimate } = useEstimates();
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showWorkOrderDialog, setShowWorkOrderDialog] = useState(false);

  const handleDeleteClick = (estimateId: string) => {
    setSelectedEstimateId(estimateId);
    setShowDeleteDialog(true);
  };

  const handleCreateWorkOrder = (estimateId: string) => {
    setSelectedEstimateId(estimateId);
    setShowWorkOrderDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEstimateId) return;
    
    setIsDeleting(true);
    try {
      await deleteEstimate(selectedEstimateId);
    } catch (error) {
      console.error("Error deleting estimate:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading estimates...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        Error loading estimates: {error.message}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {estimates.map((estimate) => {
            // Format created date
            const createdDate = new Date(estimate.created_at).toLocaleDateString();
            
            // Format customer name
            const customerName = estimate.profiles ? 
              `${estimate.profiles.first_name || ''} ${estimate.profiles.last_name || ''}`.trim() || 
              estimate.profiles.email : 'Unknown';
            
            // Format vehicle name
            const vehicleName = estimate.vehicles ? 
              `${estimate.vehicles.year} ${estimate.vehicles.make} ${estimate.vehicles.model}`.trim() : 
              'Unknown';
            
            return (
              <TableRow key={estimate.id}>
                <TableCell className="font-medium">
                  #{estimate.id.substring(0, 8)}
                </TableCell>
                <TableCell>{estimate.title}</TableCell>
                <TableCell>{customerName}</TableCell>
                <TableCell>{vehicleName}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(estimate.total_amount)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={estimate.status} />
                </TableCell>
                <TableCell>{createdDate}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onSelect={() => onEdit(estimate)}
                        className="cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        asChild
                        className="cursor-pointer"
                      >
                        <Link to={`/shop/invoices/new?estimateId=${estimate.id}`}>
                          <FileText className="mr-2 h-4 w-4" />
                          Convert to Invoice
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onSelect={() => handleCreateWorkOrder(estimate.id)}
                        className="cursor-pointer"
                      >
                        <Hammer className="mr-2 h-4 w-4" />
                        Create Work Order
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onSelect={() => handleDeleteClick(estimate.id)}
                        className="cursor-pointer text-red-600"
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

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmDelete}
      />

      {showWorkOrderDialog && selectedEstimateId && (
        <EstimateToWorkOrderDialog
          open={showWorkOrderDialog}
          onClose={() => setShowWorkOrderDialog(false)}
          estimateId={selectedEstimateId}
        />
      )}
    </div>
  );
}
