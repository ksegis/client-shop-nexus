
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface UserProfileDropdownProps {
  portalType?: 'shop';
  onSignOut?: () => Promise<void>;
}

const UserProfileDropdown = ({ portalType, onSignOut }: UserProfileDropdownProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  // Mock user data
  const mockUser = {
    firstName: "Dev",
    lastName: "User",
    email: "customer@example.com",
    role: "customer"
  };
  
  const firstName = mockUser.firstName;
  const lastName = mockUser.lastName;
  const initials = firstName && lastName ? `${firstName[0]}${lastName[0]}` : "U";
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : mockUser.email || "User";
  const role = mockUser.role;
  const isDevMode = true;
  
  const handleSignOut = async () => {
    if (onSignOut) {
      await onSignOut();
    } else {
      // Simply navigate without auth check
      navigate("/auth");
    }
  };
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full flex items-center justify-center"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={fullName} />
            <AvatarFallback className="bg-shop-primary text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium">{fullName}</p>
            <p className="text-xs text-muted-foreground">
              {role.charAt(0).toUpperCase() + role.slice(1)}
              {isDevMode && " (Dev Mode)"}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer flex w-full items-center">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="cursor-pointer flex w-full items-center">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfileDropdown;
