
import { useCustomers } from './CustomersContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, User, Phone, Mail, Calendar } from 'lucide-react';
import EmptyState from './components/EmptyState';
import DeleteConfirmationDialog from './components/DeleteConfirmationDialog';
import { useState } from 'react';
import { CustomerDialog } from './CustomerDialog';
import { format } from 'date-fns';

interface CustomersTableProps {
  filter: 'all' | 'recent';
  searchQuery: string;
}

export function CustomersTable({ filter, searchQuery }: CustomersTableProps) {
  const { customers, isLoading } = useCustomers();
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<string | null>(null);
  
  // Filter customers based on the selected filter
  const filteredCustomers = customers.filter(customer => {
    // Apply search filter if searchQuery exists
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase();
      
      if (!fullName.includes(query) && 
          !customer.email.toLowerCase().includes(query) && 
          !(customer.phone && customer.phone.toLowerCase().includes(query))) {
        return false;
      }
    }
    
    // Apply tab filter
    if (filter === 'recent') {
      // Filter to customers created in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(customer.created_at) >= thirtyDaysAgo;
    }
    
    // 'all' filter doesn't need additional filtering
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (filteredCustomers.length === 0) {
    return <EmptyState filter={filter} searchQuery={searchQuery} />;
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="hidden md:table-cell">Phone</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCustomers.map(customer => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {customer.first_name || customer.last_name ? 
                    `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : 
                    <span className="text-muted-foreground italic">No name</span>}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {customer.email}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {customer.phone || <span className="text-muted-foreground italic">No phone</span>}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(customer.created_at), 'MMM d, yyyy')}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCustomerToEdit(customer.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setCustomerToDelete(customer.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit Customer Dialog */}
      {customerToEdit && (
        <CustomerDialog 
          customerId={customerToEdit} 
          open={true} 
          onOpenChange={() => setCustomerToEdit(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {customerToDelete && (
        <DeleteConfirmationDialog
          customerId={customerToDelete}
          open={true}
          onOpenChange={() => setCustomerToDelete(null)}
        />
      )}
    </div>
  );
}
