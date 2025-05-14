
import { Link } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  Settings
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface UserProfileDropdownProps {
  portalType: 'customer' | 'shop';
  onSignOut: () => void;
}

export const UserProfileDropdown = ({ portalType, onSignOut }: UserProfileDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-full p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg" alt="Profile" />
            <AvatarFallback>
              <User className="h-5 w-5 text-shop-primary" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={portalType === 'customer' ? '/customer/profile' : '/shop/profile'}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={portalType === 'customer' ? '/customer/settings' : '/shop/settings'}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
