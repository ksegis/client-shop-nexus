
import React, { useState } from 'react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useEmployees } from './EmployeesContext';
import { supabase } from '@/integrations/supabase/client';
import { EmployeeDialog } from './EmployeeDialog';

export const EmployeesList = () => {
  const { toast } = useToast();
  const { employees, isLoading, error, selectedEmployeeId, setSelectedEmployeeId, refetchEmployees } = useEmployees();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const handleSelectEmployee = (id: string) => {
    setSelectedEmployeeId(selectedEmployeeId === id ? null : id);
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEditDialogOpen(true);
  };

  const handleDeactivateEmployee = async (employee) => {
    try {
      // Instead of updating a non-existent status field, we'll change the role to 'inactive_staff'
      // Let's toggle between 'staff' and 'inactive_staff' or 'admin' and 'inactive_admin'
      let newRole = employee.role;
      
      if (employee.role === 'staff') {
        newRole = 'inactive_staff';
      } else if (employee.role === 'admin') {
        newRole = 'inactive_admin';
      } else if (employee.role === 'inactive_staff') {
        newRole = 'staff';
      } else if (employee.role === 'inactive_admin') {
        newRole = 'admin';
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', employee.id);
        
      if (error) throw error;
      
      await refetchEmployees();
      
      const action = newRole.startsWith('inactive') ? 'deactivated' : 'reactivated';
      toast({
        title: `Employee ${action}`,
        description: `${employee.first_name} ${employee.last_name} has been ${action}`,
      });
    } catch (error) {
      toast({
        title: "Error updating employee",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading employee data...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">Error loading employee data</div>;
  }

  return (
    <>
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
          {employees.map((employee) => (
            <TableRow 
              key={employee.id}
              className={selectedEmployeeId === employee.id ? "bg-muted" : ""}
              onClick={() => handleSelectEmployee(employee.id)}
            >
              <TableCell className="font-medium">
                {employee.first_name} {employee.last_name}
              </TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>{employee.phone || "—"}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  employee.role === 'admin' || employee.role === 'inactive_admin'
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {employee.role === 'inactive_admin' ? 'admin' : 
                   employee.role === 'inactive_staff' ? 'staff' : 
                   employee.role}
                </span>
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  employee.role.startsWith('inactive_') 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {employee.role.startsWith('inactive_') ? 'inactive' : 'active'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditEmployee(employee);
                    }}
                  >
                    <UserCheck className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeactivateEmployee(employee);
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

      {/* Edit Employee Dialog */}
      <EmployeeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          setEditDialogOpen(false);
          setSelectedEmployee(null);
          refetchEmployees();
        }}
        employee={selectedEmployee}
      />
    </>
  );
};
