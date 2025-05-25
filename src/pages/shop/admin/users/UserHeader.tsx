
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface UserHeaderProps {
  onAddUser: () => void;
}

export function UserHeader({ onAddUser }: UserHeaderProps) {
  return (
    <Button onClick={onAddUser}>
      <Plus className="mr-2 h-4 w-4" />
      Add User
    </Button>
  );
}
