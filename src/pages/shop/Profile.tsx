
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { useProfileData } from '@/hooks/useProfileData';
import ProfileLoadingState from '@/components/shop/profile/ProfileLoadingState';
import ProfileErrorState from '@/components/shop/profile/ProfileErrorState';
import ProfileNotFoundState from '@/components/shop/profile/ProfileNotFoundState';
import ProfileCard from '@/components/shop/profile/ProfileCard';

const ProfilePage: React.FC = () => {
  const { profileData, isLoading, error, refreshProfile } = useProfileData();

  if (isLoading) {
    return (
      <Layout portalType="shop">
        <ProfileLoadingState />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout portalType="shop">
        <ProfileErrorState errorMessage={error.message} onRefresh={refreshProfile} />
      </Layout>
    );
  }

  if (!profileData) {
    return (
      <Layout portalType="shop">
        <ProfileNotFoundState onRefresh={refreshProfile} />
      </Layout>
    );
  }

  return (
    <Layout portalType="shop">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>
        <ProfileCard profileData={profileData} />
      </div>
    </Layout>
  );
};

export default ProfilePage;
