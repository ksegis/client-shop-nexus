
import React from 'react';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { ProfilePicture } from '@/components/shared/profile/ProfilePicture';

type ProfileHeaderProps = {
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  userId?: string;
  avatarUrl?: string | null;
  onAvatarUpdate?: (url: string) => void;
};

const ProfileHeader = ({ 
  firstName, 
  lastName, 
  email, 
  role,
  userId,
  avatarUrl,
  onAvatarUpdate 
}: ProfileHeaderProps) => {
  return (
    <div className="flex items-center gap-4">
      {userId && onAvatarUpdate ? (
        <ProfilePicture 
          userId={userId}
          avatarUrl={avatarUrl || null}
          firstName={firstName}
          lastName={lastName}
          onUploadComplete={onAvatarUpdate}
          size="lg"
        />
      ) : (
        <div className="h-16 w-16 rounded-full bg-shop-light flex items-center justify-center">
          <ProfilePicture
            userId=""
            avatarUrl={avatarUrl || null}
            firstName={firstName}
            lastName={lastName}
            onUploadComplete={() => {}}
            size="sm"
          />
        </div>
      )}
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
