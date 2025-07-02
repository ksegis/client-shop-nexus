
import React, { useState } from 'react';
import { useProfileData } from '@/hooks/useProfileData';
import ProfileLoadingState from '@/components/shop/profile/ProfileLoadingState';
import ProfileErrorState from '@/components/shop/profile/ProfileErrorState';
import ProfileNotFoundState from '@/components/shop/profile/ProfileNotFoundState';
import ProfileCard from '@/components/shop/profile/ProfileCard';
import { SecuritySettings } from '@/components/shop/profile/SecuritySettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, ShieldCheck, UserCog } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { profileData, isLoading, error, refreshProfile } = useProfileData();
  const [activeTab, setActiveTab] = useState('profile');

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
      <h1 className="text-2xl font-bold mb-6">My Account</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <ProfileCard profileData={profileData} />
        </TabsContent>
        
        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
