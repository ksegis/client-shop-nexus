
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminUser } from '../types/adminTypes';
import { UserProfileForm } from './UserProfileForm';
import { UserAuditTrail } from './UserAuditTrail';

interface UserProfileDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserProfileDialog = ({ user, open, onOpenChange }: UserProfileDialogProps) => {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            User Profile: {user.first_name} {user.last_name}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile Info</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <UserProfileForm user={user} onClose={() => onOpenChange(false)} />
          </TabsContent>
          
          <TabsContent value="audit">
            <UserAuditTrail userId={user.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
