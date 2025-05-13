
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileData } from '@/hooks/useProfileData';
import ProfileLoadingState from '@/components/shop/profile/ProfileLoadingState';
import ProfileErrorState from '@/components/shop/profile/ProfileErrorState';
import ProfileNotFoundState from '@/components/shop/profile/ProfileNotFoundState';
import ProfileCard from '@/components/shop/profile/ProfileCard';

const ProfilePage: React.FC = () => {
  const { profileData, isLoading, error, refreshProfile } = useProfileData();

  if (isLoading) {
    return <ProfileLoadingState />;
  }

  if (error) {
    return <ProfileErrorState errorMessage={error.message} onRefresh={refreshProfile} />;
  }

  if (!profileData) {
    return <ProfileNotFoundState onRefresh={refreshProfile} />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      <ProfileCard profileData={profileData} />
    </div>
  );
};

export default ProfilePage;
