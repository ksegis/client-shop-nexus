import { useState } from 'react';
import { useCustomers, Customer } from './CustomersContext';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, User } from 'lucide-react';
import { CustomerDetailDialog } from './CustomerDetailDialog';

interface CustomersTableProps {
  filter: 'all' | 'recent';
  searchQuery: string;
}

export function CustomersTable({ filter, searchQuery }: CustomersTableProps) {
  const { customers, isLoading } = useCustomers();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Filter customers based on search and filter type
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchQuery || 
      `${customer.first_name} ${customer.last_name} ${customer.email}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    
    if (filter === 'recent') {
      // Show customers created in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return matchesSearch && new Date(customer.created_at) > thirtyDaysAgo;
    }
    
    return matchesSearch;
  });

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailDialogOpen(true);
  };

  const handleCustomerUpdate = () => {
    // Refresh will happen automatically through the context
    setDetailDialogOpen(false);
    setSelectedCustomer(null);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading customers...</p>
      </div>
    );
  }

  if (filteredCustomers.length === 0) {
    return (
      <div className="p-8 text-center">
        <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500 mb-2">No customers found</p>
        {searchQuery && (
          <p className="text-sm text-gray-400">
            Try adjusting your search criteria
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">
                  {customer.first_name && customer.last_name 
                    ? `${customer.first_name} ${customer.last_name}`
                    : 'No name provided'
                  }
                </TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone || 'Not provided'}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{customer.role}</Badge>
                </TableCell>
                <TableCell>
                  {new Date(customer.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCustomer(customer)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CustomerDetailDialog
        customer={selectedCustomer}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onUpdate={handleCustomerUpdate}
      />
    </>
  );
}
