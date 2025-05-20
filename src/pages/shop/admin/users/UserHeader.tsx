
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, UserPlus } from 'lucide-react';

interface UserHeaderProps {
  onAddUser: () => void;
}

export function UserHeader({ onAddUser }: UserHeaderProps) {
  return (
    <>
      <Button 
        variant="outline" 
        onClick={onAddUser}
        className="flex items-center gap-2"
      >
        <Mail className="h-4 w-4" /> Invite User
      </Button>
      <Button 
        onClick={onAddUser}
        className="flex items-center gap-2"
      >
        <UserPlus className="h-4 w-4" /> Add User
      </Button>
    </>
  );
}
