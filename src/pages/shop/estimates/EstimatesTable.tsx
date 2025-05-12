
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Estimate, EstimateStatus } from './types';
import StatusBadge from './components/StatusBadge';
import { format } from 'date-fns';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { useEstimates } from './EstimatesContext';
import DeleteConfirmationDialog from './components/DeleteConfirmationDialog';

interface EstimatesTableProps {
  onEdit: (estimate: Estimate) => void;
}

export default function EstimatesTable({ onEdit }: EstimatesTableProps) {
  const { estimates, updateEstimateStatus, deleteEstimate } = useEstimates();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [estimateToDelete, setEstimateToDelete] = useState<Estimate | null>(null);

  const handleStatusUpdate = (id: string, newStatus: EstimateStatus) => {
    updateEstimateStatus(id, newStatus);
  };

  const confirmDelete = (estimate: Estimate) => {
    setEstimateToDelete(estimate);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (estimateToDelete) {
      await deleteEstimate(estimateToDelete.id);
      setDeleteDialogOpen(false);
      setEstimateToDelete(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {estimates.map((estimate) => (
            <TableRow key={estimate.id}>
              <TableCell className="font-mono text-xs">
                {estimate.id.substring(0, 8)}...
              </TableCell>
              <TableCell>
                {estimate.profiles 
                  ? `${estimate.profiles.first_name || ''} ${estimate.profiles.last_name || ''}`.trim() || estimate.profiles.email
                  : 'Unknown'}
              </TableCell>
              <TableCell>
                {estimate.vehicles
                  ? `${estimate.vehicles.year} ${estimate.vehicles.make} ${estimate.vehicles.model}`
                  : 'Unknown'}
              </TableCell>
              <TableCell>{estimate.title}</TableCell>
              <TableCell>{format(new Date(estimate.created_at), 'MMM d, yyyy')}</TableCell>
              <TableCell>{formatCurrency(estimate.total_amount)}</TableCell>
              <TableCell>
                <StatusBadge status={estimate.status} />
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(estimate)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => confirmDelete(estimate)}>
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                    {/* Status change options */}
                    <DropdownMenuItem
                      disabled={estimate.status === 'pending'}
                      onClick={() => handleStatusUpdate(estimate.id, 'pending')}
                    >
                      Mark as Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={estimate.status === 'approved'}
                      onClick={() => handleStatusUpdate(estimate.id, 'approved')}
                    >
                      Mark as Approved
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={estimate.status === 'declined'}
                      onClick={() => handleStatusUpdate(estimate.id, 'declined')}
                    >
                      Mark as Declined
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={estimate.status === 'completed'}
                      onClick={() => handleStatusUpdate(estimate.id, 'completed')}
                    >
                      Mark as Completed
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Estimate"
        description={`Are you sure you want to delete this estimate? This action cannot be undone.`}
      />
    </>
  );
}
