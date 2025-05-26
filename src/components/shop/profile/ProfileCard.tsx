
import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import ProfileHeader from './ProfileHeader';
import { ProfileForm, profileFormSchema, ProfileFormValues } from './ProfileForm';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProfileData } from '@/hooks/useProfileData';
import { useToast } from '@/hooks/use-toast';

type ProfileCardProps = {
  profileData: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    role: string;
    avatar_url?: string | null;
  };
};

const ProfileCard = ({ profileData }: ProfileCardProps) => {
  const { updateProfileData, updateProfileAvatar } = useProfileData();
  const { toast } = useToast();
  
  const handleAvatarUpdate = async (url: string) => {
    try {
      await updateProfileAvatar(url);
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast({
        variant: "destructive",
        title: "Avatar update failed",
        description: "There was a problem updating your profile picture",
      });
    }
  };

  const handleProfileUpdate = async () => {
    // Refresh profile data after update
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader>
        <ProfileHeader 
          firstName={profileData.first_name}
          lastName={profileData.last_name}
          email={profileData.email}
          role={profileData.role}
          userId={profileData.id}
          avatarUrl={profileData.avatar_url}
          onAvatarUpdate={handleAvatarUpdate}
        />
      </CardHeader>
      <CardContent>
        <ProfileForm profile={profileData} onUpdate={handleProfileUpdate} />
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
