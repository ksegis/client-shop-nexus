
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useProfileData } from '@/hooks/useProfileData';
import { Loader2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const profileFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { profileData, isLoading, updateProfileData, error } = useProfileData();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    values: profileData ? {
      firstName: profileData.first_name || '',
      lastName: profileData.last_name || '',
      email: profileData.email || '',
      phone: profileData.phone || '',
    } : undefined,
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

  if (isLoading) {
    return (
      <Layout portalType="shop">
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-shop-primary" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout portalType="shop">
        <div className="max-w-3xl mx-auto p-4 bg-red-50 rounded-md border border-red-200">
          <h1 className="text-2xl font-bold mb-2 text-red-600">Error Loading Profile</h1>
          <p className="text-gray-700">{error.message}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </Layout>
    );
  }

  if (!profileData) {
    return (
      <Layout portalType="shop">
        <div className="max-w-3xl mx-auto p-4 bg-amber-50 rounded-md border border-amber-200">
          <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
          <p className="text-gray-700">We couldn't find your profile information. Please try refreshing the page.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout portalType="shop">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-shop-light flex items-center justify-center">
                <User className="h-8 w-8 text-shop-primary" />
              </div>
              <div>
                <CardTitle>
                  {profileData?.first_name || ''} {profileData?.last_name || ''}
                  <span className="ml-2 text-sm font-normal bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {profileData?.role || 'staff'}
                  </span>
                </CardTitle>
                <CardDescription>{profileData?.email}</CardDescription>
              </div>
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
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
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
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={!form.formState.isDirty}>
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProfilePage;
