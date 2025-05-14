
import { useAuth } from '@/contexts/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserRound, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserProfileDropdownProps {
  portalType: 'shop' | 'customer';
  onSignOut: () => void;
}

const UserProfileDropdown = ({ portalType, onSignOut }: UserProfileDropdownProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const navigateToProfile = () => {
    if (portalType === 'shop') {
      navigate('/shop/profile');
    } else {
      navigate('/customer/profile');
    }
  };
  
  // Get first letter of email or name for Avatar fallback
  const getInitial = () => {
    if (!user) return '?';
    
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.user_metadata?.avatar_url || ''} />
          <AvatarFallback>{getInitial()}</AvatarFallback>
        </Avatar>
        <span className="hidden md:inline text-sm font-medium">
          {user?.email || 'User'}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-medium">
          {user?.email || 'User'}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={navigateToProfile} className="cursor-pointer">
          <UserRound className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSignOut} className="cursor-pointer text-red-500 focus:text-red-500">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfileDropdown;
