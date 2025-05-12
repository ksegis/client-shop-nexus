
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { EmployeesProvider } from './employees/EmployeesContext';
import { EmployeesList } from './employees/EmployeesList';
import { EmployeeHeader } from './employees/EmployeeHeader';
import { EmployeePerformance } from './employees/EmployeePerformance';
import { EmployeeDialog } from './employees/EmployeeDialog';

const Employees = () => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  return (
    <EmployeesProvider>
      <div className="space-y-6">
        <EmployeeHeader onAddEmployee={() => setAddDialogOpen(true)} />

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
            <EmployeesList />
          </CardContent>
        </Card>

        <EmployeePerformance />
        
        {/* Add Employee Dialog */}
        <EmployeeDialog 
          open={addDialogOpen} 
          onOpenChange={setAddDialogOpen} 
          onSuccess={() => {
            setAddDialogOpen(false);
          }}
          employee={null}
        />
      </div>
    </EmployeesProvider>
  );
};

export default function EmployeesPage() {
  return (
    <Layout portalType="shop">
      <Employees />
    </Layout>
  );
}
