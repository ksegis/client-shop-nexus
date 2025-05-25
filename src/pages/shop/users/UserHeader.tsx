
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface UserHeaderProps {
  onAddUser: () => void;
}

export const UserHeader = ({ onAddUser }: UserHeaderProps) => {
  const userCount = 0; // Simplified since no admin functionality

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          User management functionality has been deprecated
        </p>
      </div>
    </div>
  );
};
