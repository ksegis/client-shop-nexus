import Layout from '@/components/layout/Layout';
import { useState } from 'react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, UserX, UserCheck, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EmployeeDialog } from './employees/EmployeeDialog';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
  status: 'active' | 'inactive';
}

const Employees = () => {
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: employees, isLoading, error, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      // Fetch employees from profiles table where role is staff or admin
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['staff', 'admin']);
      
      if (error) throw new Error(error.message);
      
      // Transform data to match the Employee interface
      return (data || []).map((profile: any) => ({
        id: profile.id,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        status: 'active' // Assuming all employees are active by default
      }));
    }
  });

  const handleSelectEmployee = (id: string) => {
    setSelectedEmployee(selectedEmployee === id ? null : id);
  };

  const demoEmployees: Employee[] = [
    {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-123-4567',
      role: 'admin',
      status: 'active'
    },
    {
      id: '2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone: '555-987-6543',
      role: 'staff',
      status: 'active'
    },
    {
      id: '3',
      first_name: 'Robert',
      last_name: 'Johnson',
      email: 'robert.johnson@example.com',
      phone: '555-456-7890',
      role: 'staff',
      status: 'inactive'
    }
  ];

  // Use demo data if no real data is available yet
  const displayEmployees = employees || demoEmployees;

  return (
    <Layout portalType="shop">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
            <p className="text-muted-foreground">
              Manage your shop staff and admin accounts.
            </p>
          </div>
          <Button className="flex gap-2" onClick={() => setAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4" />
            <span>Add Employee</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> 
              Employee Directory
            </CardTitle>
            <CardDescription>
              View and manage all employees working at your shop.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading employee data...</div>
            ) : error ? (
              <div className="text-center text-red-500 py-4">Error loading employee data</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayEmployees.map((employee) => (
                    <TableRow 
                      key={employee.id}
                      className={selectedEmployee === employee.id ? "bg-muted" : ""}
                      onClick={() => handleSelectEmployee(employee.id)}
                    >
                      <TableCell className="font-medium">
                        {employee.first_name} {employee.last_name}
                      </TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.phone || "—"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          employee.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {employee.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          employee.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast({
                                title: "Edit employee",
                                description: `Editing ${employee.first_name} ${employee.last_name}`,
                              });
                            }}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast({
                                title: "Deactivate employee",
                                description: `${employee.first_name} ${employee.last_name} would be deactivated`,
                                variant: "destructive",
                              });
                            }}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Employee Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Employee performance metrics will appear here. This section will show data like completed jobs, customer satisfaction ratings, and efficiency metrics.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Employee Dialog */}
      <EmployeeDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen} 
        onSuccess={() => refetch()}
      />
    </Layout>
  );
};

export default Employees;
