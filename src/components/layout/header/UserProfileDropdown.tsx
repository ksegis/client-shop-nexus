
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface UserProfileDropdownProps {
  portalType?: 'shop' | 'customer';
  onSignOut?: () => Promise<void>;
}

const UserProfileDropdown = ({ 
  portalType = 'shop', 
  onSignOut 
}: UserProfileDropdownProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock user data for development
  const user = {
    firstName: portalType === 'customer' ? 'John' : 'Admin',
    lastName: portalType === 'customer' ? 'Driver' : 'User',
    email: portalType === 'customer' ? 'customer@example.com' : 'admin@example.com',
    role: portalType === 'customer' ? 'customer' : 'admin'
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      
      if (onSignOut) {
        await onSignOut();
      } else {
        // Default behavior - navigate to auth page
        navigate('/auth');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 flex items-center space-x-2 px-2">
          <div className="w-8 h-8 rounded-full bg-shop-primary flex items-center justify-center text-white">
            <span className="text-sm font-medium">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </span>
          </div>
          <div className="hidden md:flex flex-col items-start text-left">
            <span className="text-sm font-medium">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-xs text-muted-foreground">
              {user.role}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="font-medium">{user.firstName} {user.lastName}</span>
          <span className="font-normal text-xs text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={portalType === 'customer' ? "/customer/profile" : "/shop/profile"} className="cursor-pointer flex w-full items-center">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={portalType === 'customer' ? "/customer/profile" : "/shop/profile"} className="cursor-pointer flex w-full items-center">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isLoading} onSelect={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          {isLoading ? 'Signing out...' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfileDropdown;
