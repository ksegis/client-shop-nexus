
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface UserAvatarProps {
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserAvatar = ({
  avatarUrl,
  firstName,
  lastName,
  size = 'md',
  className = '',
}: UserAvatarProps) => {
  // Get initials from name
  const getInitials = () => {
    const firstInitial = firstName?.[0] || '';
    const lastInitial = lastName?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase() || 'U';
  };

  // Get avatar size class
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8';
      case 'lg':
        return 'h-12 w-12';
      case 'md':
      default:
        return 'h-10 w-10';
    }
  };

  return (
    <Avatar className={`${getSizeClass()} ${className}`}>
      <AvatarImage src={avatarUrl || undefined} alt="User avatar" />
      <AvatarFallback className="bg-primary text-primary-foreground font-medium">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
};
