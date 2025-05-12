
import { useState } from 'react';
import { useUserManagement } from '@/pages/shop/users/UserManagementContext';
import { useImpersonation } from '@/utils/admin/impersonationUtils';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface UserImpersonationDialogProps {
  open: boolean;
  onClose: () => void;
}

const UserImpersonationDialog = ({ open, onClose }: UserImpersonationDialogProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'customer' | 'staff'>('customer');
  const { users, isLoading } = useUserManagement();
  const { impersonateUser } = useImpersonation();
  const navigate = useNavigate();
  
  const customers = users.filter(user => user.role === 'customer');
  const staffMembers = users.filter(user => ['staff', 'admin'].includes(user.role));
  
  const handleImpersonate = async () => {
    if (!selectedUserId) return;
    
    setLoading(true);
    
    const userToImpersonate = users.find(u => u.id === selectedUserId);
    if (!userToImpersonate) {
      setLoading(false);
      return;
    }
    
    const success = await impersonateUser(
      selectedUserId, 
      `${userToImpersonate.first_name} ${userToImpersonate.last_name}`
    );
    
    if (success) {
      // Navigate to appropriate page based on role
      if (['staff', 'admin'].includes(userToImpersonate.role)) {
        navigate('/shop');
      } else {
        navigate('/customer/profile');
      }
      onClose();
    }
    
    setLoading(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Login As User</DialogTitle>
          <DialogDescription>
            Impersonate a user to troubleshoot issues or provide support.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Tabs value={tab} onValueChange={(value) => setTab(value as 'customer' | 'staff')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
            </TabsList>
            
            <TabsContent value="customer" className="mt-4">
              <Select 
                value={selectedUserId} 
                onValueChange={setSelectedUserId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name} ({customer.email})
                    </SelectItem>
                  ))}
                  {customers.length === 0 && !isLoading && (
                    <SelectItem value="no-customers" disabled>
                      No customers found
                    </SelectItem>
                  )}
                  {isLoading && (
                    <SelectItem value="loading" disabled>
                      Loading customers...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </TabsContent>
            
            <TabsContent value="staff" className="mt-4">
              <Select 
                value={selectedUserId} 
                onValueChange={setSelectedUserId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map(staff => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.first_name} {staff.last_name} ({staff.role})
                    </SelectItem>
                  ))}
                  {staffMembers.length === 0 && !isLoading && (
                    <SelectItem value="no-staff" disabled>
                      No staff members found
                    </SelectItem>
                  )}
                  {isLoading && (
                    <SelectItem value="loading" disabled>
                      Loading staff...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleImpersonate} 
            disabled={!selectedUserId || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Switching...
              </>
            ) : (
              'Login as User'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserImpersonationDialog;
