
import React from 'react';
import { useUserManagement } from './UserManagementContext';
import { useUserTableActions } from './hooks/useUserTableActions';
import { Table, TableBody } from '@/components/ui/table';
import { TooltipProvider } from '@/components/ui/tooltip';
import { UserTableHeader } from './components/UserTableHeader';
import { UserTableRow } from './components/UserTableRow';
import { UserTableLoading } from './components/UserTableLoading';
import { UserTableEmpty } from './components/UserTableEmpty';

interface UsersTableProps {
  onResetPassword: (userId: string, email: string) => void;
  onEditProfile: (userId: string, email: string) => void;
  onImpersonate: (userId: string, email: string) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({ 
  onResetPassword, 
  onEditProfile,
  onImpersonate
}) => {
  const { users, isLoading } = useUserManagement();
  const {
    impersonationLoading,
    activationLoading,
    getInviterName,
    handleImpersonate,
    handleToggleActive
  } = useUserTableActions();

  if (isLoading) {
    return <UserTableLoading />;
  }

  if (users.length === 0) {
    return <UserTableEmpty />;
  }

  return (
    <TooltipProvider>
      <div className="border rounded-md">
        <Table>
          <UserTableHeader />
          <TableBody>
            {users.map((user) => (
              <UserTableRow
                key={user.id}
                user={user}
                impersonationLoading={impersonationLoading}
                activationLoading={activationLoading}
                onResetPassword={onResetPassword}
                onEditProfile={onEditProfile}
                onImpersonate={(userId, email) => {
                  handleImpersonate(userId, email);
                  onImpersonate(userId, email);
                }}
                onToggleActive={handleToggleActive}
                getInviterName={getInviterName}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
};
