
import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import ProfileHeader from './ProfileHeader';
import ProfileForm from './ProfileForm';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileFormSchema, ProfileFormValues } from './ProfileForm';
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
  };
};

const ProfileCard = ({ profileData }: ProfileCardProps) => {
  const { updateProfileData } = useProfileData();
  const { toast } = useToast();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: profileData.first_name || '',
      lastName: profileData.last_name || '',
      email: profileData.email || '',
      phone: profileData.phone || '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await updateProfileData({
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was a problem updating your profile information",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <ProfileHeader 
          firstName={profileData.first_name}
          lastName={profileData.last_name}
          email={profileData.email}
          role={profileData.role}
        />
      </CardHeader>
      <CardContent>
        <ProfileForm form={form} onSubmit={onSubmit} />
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
