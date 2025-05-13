
import React from 'react';
import { useProfileData } from '@/hooks/useProfileData';
import PersonalInfoCard from '@/components/customer/PersonalInfoCard';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings } from 'lucide-react';

const CustomerSettings = () => {
  const { profileData, isLoading, error } = useProfileData();

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex items-center mb-6">
          <Settings className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        <div className="h-96 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading settings...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex items-center mb-6">
          <Settings className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-red-500">
              <p>There was an error loading your settings: {error.message}</p>
              <p>Please try refreshing the page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex items-center mb-6">
          <Settings className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p>No profile data available. Please complete your profile information.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center mb-6">
        <Settings className="h-6 w-6 mr-2" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <PersonalInfoCard profileData={profileData} />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
              <p className="text-gray-500">
                Notification settings will be available in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
              <p className="text-gray-500">
                Security settings will be available in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerSettings;
