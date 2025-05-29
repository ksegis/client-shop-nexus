import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Phone, Mail, Truck as TruckIcon } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useProfileData } from '@/hooks/profile';
import { useAuth } from '@/contexts/auth';
import { ProfilePicture } from '@/components/shared/profile/ProfilePicture';
import CustomerApiKeysManager from '@/components/customer/api-keys/CustomerApiKeysManager';

const profileFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const Profile = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profileData, updateProfileData, updateProfileAvatar } = useProfileData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form with user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: profileData?.first_name || '',
      lastName: profileData?.last_name || '',
      email: user?.email || '',
      phone: profileData?.phone || '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsSubmitting(true);
      await updateProfileData({
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was a problem updating your profile.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUpdate = async (url: string) => {
    try {
      await updateProfileAvatar(url);
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was a problem updating your profile picture.",
      });
    }
  };

  if (!user || !profileData) {
    return <div className="flex justify-center p-6">Loading profile...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <ProfilePicture 
                userId={user.id}
                avatarUrl={profileData.avatar_url || null}
                firstName={profileData.first_name}
                lastName={profileData.last_name}
                onUploadComplete={handleAvatarUpdate}
                size="lg"
              />
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your account details and contact information</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input className="pl-10" {...field} />
                            </FormControl>
                            <span className="absolute left-3 top-3 text-gray-400">
                              <span className="sr-only">First Name</span>
                            </span>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input className="pl-10" {...field} />
                            </FormControl>
                            <span className="absolute left-3 top-3 text-gray-400">
                              <span className="sr-only">Last Name</span>
                            </span>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-gray-400">
                            <Mail size={18} />
                          </span>
                          <FormControl>
                            <Input className="pl-10" {...field} disabled />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-gray-400">
                            <Phone size={18} />
                          </span>
                          <FormControl>
                            <Input className="pl-10" {...field} />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>My Vehicles</CardTitle>
              <CardDescription>Manage your registered vehicles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center h-24">
                <TruckIcon className="h-12 w-12 text-gray-300" />
              </div>
              <p className="text-center text-sm text-gray-500">
                Add your vehicles to receive personalized service and maintenance recommendations
              </p>
              <Button variant="outline" className="w-full" asChild>
                <RouterLink to="/customer/vehicles">
                  Manage Vehicles
                </RouterLink>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <CustomerApiKeysManager />
    </div>
  );
};

export default Profile;
