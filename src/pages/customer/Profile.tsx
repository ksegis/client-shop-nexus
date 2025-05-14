
import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, User, Phone, Mail, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useVehicleManagement } from '@/hooks/useVehicleManagement';

const profileFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const CustomerProfile = () => {
  const { toast } = useToast();
  const { vehicles } = useVehicleManagement();
  
  // Mock profile data
  const profileData = {
    id: 'mock-user-id',
    email: 'customer@example.com',
    first_name: 'John',
    last_name: 'Driver',
    phone: '555-123-4567',
    role: 'customer',
  };

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
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="profile">Personal Info</TabsTrigger>
          <TabsTrigger value="vehicles">My Vehicles</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-shop-primary flex items-center justify-center text-white text-2xl">
                  {profileData.first_name?.[0]}{profileData.last_name?.[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{profileData.first_name} {profileData.last_name}</h2>
                  <p className="text-gray-500">{profileData.email}</p>
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
                            <Input {...field} icon={<User className="h-4 w-4 text-gray-400" />} />
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
                            <Input {...field} icon={<User className="h-4 w-4 text-gray-400" />} />
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
                          <Input {...field} disabled icon={<Mail className="h-4 w-4 text-gray-400" />} />
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
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} icon={<Phone className="h-4 w-4 text-gray-400" />} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={!form.formState.isDirty} className="w-full md:w-auto">
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="vehicles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles && vehicles.length > 0 ? (
              vehicles.map((vehicle) => (
                <Card key={vehicle.id} className="overflow-hidden">
                  <AspectRatio ratio={16/9}>
                    <div className="h-full bg-gray-100 flex items-center justify-center">
                      {vehicle.images && vehicle.images.length > 0 ? (
                        <img 
                          src={vehicle.images[0]} 
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Truck size={48} />
                          <p className="text-sm mt-2">No Image</p>
                        </div>
                      )}
                    </div>
                  </AspectRatio>
                  
                  <CardContent className="p-4">
                    <h3 className="text-lg font-bold">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                    <p className="text-gray-500 text-sm">
                      {vehicle.license_plate && `License: ${vehicle.license_plate}`}
                      {vehicle.vin && <span className="block">VIN: {vehicle.vin}</span>}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full p-6">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium">No Vehicles Added</h3>
                  <p className="text-gray-500 text-sm">You haven't added any vehicles to your account yet.</p>
                  <Button asChild>
                    <Link to="/customer/vehicles">Add a Vehicle</Link>
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerProfile;
