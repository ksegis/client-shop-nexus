
import React from 'react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useEmployees } from './EmployeesContext';

export const EmployeesList = () => {
  const { toast } = useToast();
  const { employees, isLoading, error, selectedEmployeeId, setSelectedEmployeeId } = useEmployees();

  const handleSelectEmployee = (id: string) => {
    setSelectedEmployeeId(selectedEmployeeId === id ? null : id);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading employee data...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">Error loading employee data</div>;
  }

  return (
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
  );
};
