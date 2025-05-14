
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth';
import { UserRole } from '@/contexts/auth/types';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, User, Shield, Users } from 'lucide-react';

export function TestUserManagement() {
  const { impersonateTestUser, isTestUser, profile } = useAuth();
  const [activatingRole, setActivatingRole] = useState<UserRole | null>(null);
  
  const handleActivateTestUser = (role: UserRole) => {
    setActivatingRole(role);
    setTimeout(() => {
      impersonateTestUser(role);
      setActivatingRole(null);
    }, 500);
  };
  
  const testRoles: Array<{
    role: UserRole;
    label: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      role: 'test_customer',
      label: 'Test Customer',
      description: 'Simulate a customer account to test the customer portal experience',
      icon: <User className="h-5 w-5" />,
    },
    {
      role: 'test_staff',
      label: 'Test Staff',
      description: 'Simulate a shop staff account to test limited operational access',
      icon: <Users className="h-5 w-5" />,
    },
    {
      role: 'test_admin',
      label: 'Test Admin',
      description: 'Simulate an admin account to test administrative features',
      icon: <Shield className="h-5 w-5" />,
    }
  ];
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <CardTitle>Test User Management</CardTitle>
          </div>
        </div>
        <CardDescription>
          Create and manage test accounts without affecting production data
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {testRoles.map((item) => {
            const isActive = isTestUser && profile?.role === item.role;
            
            return (
              <div 
                key={item.role}
                className={`border rounded-md p-4 transition-all ${
                  isActive ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <h3 className="font-medium">{item.label}</h3>
                  </div>
                  
                  {isActive && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      Active
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mt-2">
                  {item.description}
                </p>
                
                <Button
                  onClick={() => handleActivateTestUser(item.role)}
                  disabled={isActive || !!activatingRole}
                  variant={isActive ? "secondary" : "outline"}
                  size="sm"
                  className="mt-4 w-full"
                >
                  {activatingRole === item.role ? (
                    <>
                      <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Activating...
                    </>
                  ) : (
                    isActive ? 'Currently Active' : 'Activate'
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/50 border-t px-6 py-4">
        <div className="text-sm text-muted-foreground">
          <strong>Note:</strong> Test accounts use isolated data and do not affect production analytics.
          All actions performed in test mode are clearly marked and separated from real data.
        </div>
      </CardFooter>
    </Card>
  );
}
