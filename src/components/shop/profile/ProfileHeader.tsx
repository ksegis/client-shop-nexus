
import React from 'react';
import { User } from 'lucide-react';
import { CardTitle, CardDescription } from '@/components/ui/card';

type ProfileHeaderProps = {
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
};

const ProfileHeader = ({ firstName, lastName, email, role }: ProfileHeaderProps) => {
  return (
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 rounded-full bg-shop-light flex items-center justify-center">
        <User className="h-8 w-8 text-shop-primary" />
      </div>
      <div>
        <CardTitle>
          {firstName || ''} {lastName || ''}
          <span className="ml-2 text-sm font-normal bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
            {role || 'staff'}
          </span>
        </CardTitle>
        <CardDescription>{email}</CardDescription>
      </div>
    </div>
  );
};

export default ProfileHeader;
