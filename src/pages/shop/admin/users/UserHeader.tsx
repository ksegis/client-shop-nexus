
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserPlus2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InviteUserForm } from './InviteUserForm';
import { useAuth } from '@/contexts/auth';

interface UserHeaderProps {
  onAddUser: () => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ onAddUser }) => {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { profile } = useAuth();
  
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage users and their permissions</p>
      </div>

      <div className="flex space-x-2">
        {isAdmin && (
          <Button 
            variant="outline" 
            onClick={() => setInviteDialogOpen(true)} 
            className="flex items-center gap-2"
          >
            <UserPlus2 className="h-4 w-4" />
            <span>Invite User</span>
          </Button>
        )}
        
        <Button onClick={onAddUser} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          <span>Add User</span>
        </Button>
      </div>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Send an invitation to a new staff member to join the portal.
            </DialogDescription>
          </DialogHeader>
          <InviteUserForm 
            onSuccess={() => setInviteDialogOpen(false)} 
            onCancel={() => setInviteDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
