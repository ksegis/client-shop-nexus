
import { useAuth } from '@/contexts/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, User, Settings, ChevronDown, FlaskConical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TestingToggleButton } from '@/components/testing/TestingToggleButton';
import { Badge } from '@/components/ui/badge';

export function UserProfileDropdown() {
  const { user, profile, signOut, isTestUser, stopImpersonation } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const userInitials = user.email ? user.email.substring(0, 2).toUpperCase() : 'U';

  // Check if user is staff or admin
  const isStaffOrAdmin = profile?.role?.includes('admin') || profile?.role?.includes('staff');

  return (
    <div className="flex items-center gap-2">
      {/* Only show testing button for staff or admin */}
      {isStaffOrAdmin && (
        <TestingToggleButton />
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar>
              <AvatarFallback className={`${isTestUser ? 'bg-yellow-500 text-yellow-950' : 'bg-muted'}`}>
                {userInitials}
              </AvatarFallback>
            </Avatar>
            
            {/* Test indicator */}
            {isTestUser && (
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-500 border-2 border-background flex items-center justify-center">
                <FlaskConical className="h-3 w-3 text-yellow-950" />
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium leading-none">{user.email}</p>
                {isTestUser && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-[10px]">
                    TEST
                  </Badge>
                )}
              </div>
              <p className="text-xs leading-none text-muted-foreground">{profile?.role}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => navigate(
                profile?.role?.includes('customer') ? '/customer/profile' : '/shop/profile'
              )}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            {profile?.role?.includes('admin') && (
              <DropdownMenuItem onClick={() => navigate('/shop/admin')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Admin Settings</span>
              </DropdownMenuItem>
            )}
            
            {/* Test Mode Exit Button */}
            {isTestUser && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={stopImpersonation}>
                  <FlaskConical className="mr-2 h-4 w-4" />
                  <span>Exit Test Mode</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut(isTestUser)}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
