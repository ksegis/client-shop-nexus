
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Edit, MoreHorizontal, Trash } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Estimate } from "./EstimatesContext";
import { Database } from "@/integrations/supabase/types";
import StatusBadge from "./components/StatusBadge";
import EstimateDialog from "./EstimateDialog";
import DeleteConfirmationDialog from "./components/DeleteConfirmationDialog";
import EmptyState from "./components/EmptyState";

interface EstimatesTableProps {
  estimates: Estimate[];
  onUpdateEstimate: (id: string, estimate: Partial<Estimate>) => Promise<void>;
  onDeleteEstimate: (id: string) => Promise<void>;
  onCreateEstimate: (estimate: {
    customer_id: string;
    vehicle_id: string;
    title: string;
    description?: string | null;
    total_amount?: number;
    status?: Database['public']['Enums']['estimate_status'];
  }) => Promise<void>;
}

export function EstimatesTable({
  estimates,
  onUpdateEstimate,
  onDeleteEstimate,
  onCreateEstimate,
}: EstimatesTableProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | undefined>();

  const handleEdit = (estimate: Estimate) => {
    setSelectedEstimate(estimate);
    setEditDialogOpen(true);
  };

  const handleDelete = (estimate: Estimate) => {
    setSelectedEstimate(estimate);
    setDeleteDialogOpen(true);
  };

  if (estimates.length === 0) {
    return <EmptyState onCreateNew={() => setCreateDialogOpen(true)} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Estimates</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          Create New Estimate
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estimates.map((estimate) => (
              <TableRow key={estimate.id}>
                <TableCell className="font-medium">{estimate.title}</TableCell>
                <TableCell>
                  {estimate.customer?.first_name} {estimate.customer?.last_name}
                </TableCell>
                <TableCell>
                  {estimate.vehicles ? 
                    `${estimate.vehicles.year} ${estimate.vehicles.make} ${estimate.vehicles.model}` : 
                    "N/A"
                  }
                </TableCell>
                <TableCell>
                  <StatusBadge status={estimate.status} />
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(estimate.total_amount)}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(estimate.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(estimate)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(estimate)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <EstimateDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        estimate={selectedEstimate}
        onSubmit={(values) => {
          if (selectedEstimate) {
            return onUpdateEstimate(selectedEstimate.id, values);
          }
          return Promise.reject("No estimate selected");
        }}
        mode="edit"
      />

      {/* Create Dialog */}
      <EstimateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={onCreateEstimate}
        mode="create"
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          if (selectedEstimate) {
            return onDeleteEstimate(selectedEstimate.id);
          }
          return Promise.reject("No estimate selected");
        }}
      />
    </div>
  );
}

export default EstimatesTable;
