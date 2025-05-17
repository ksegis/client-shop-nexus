
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserPlus2, MailPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InviteUserForm } from './InviteUserForm';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';

interface UserHeaderProps {
  onAddUser: () => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ onAddUser }) => {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const isAdmin = profile?.role === 'admin';

  const handleInviteClick = () => {
    if (!isAdmin) {
      toast({
        title: "Access denied",
        description: "Only administrators can invite new users",
        variant: "destructive"
      });
      return;
    }
    setInviteDialogOpen(true);
  };

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage users and their permissions</p>
      </div>

      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          onClick={handleInviteClick}
          className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
        >
          <MailPlus className="h-4 w-4 text-blue-600" />
          <span className="font-medium">Invite User</span>
          {!isAdmin && <span className="sr-only">(Admin only)</span>}
        </Button>
        
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
