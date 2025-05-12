
import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileData } from '@/hooks/useProfileData';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: string; // Keep this as string to match the interface used elsewhere
  vin: string;
  color?: string;
  license_plate?: string;
  owner_id: string;
  vehicle_type: 'car' | 'truck' | 'motorcycle' | 'other';
  created_at: string;
  updated_at: string;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const { profileData, isLoading, updateProfileData } = useProfileData();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  
  const [newVehicle, setNewVehicle] = useState<Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'owner_id'>>({
    make: '',
    model: '',
    year: '',
    vin: '',
    vehicle_type: 'car',
    color: '',
    license_plate: '',
  });
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    async function fetchVehicles() {
      if (!user) return;
      
      try {
        setVehiclesLoading(true);
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('owner_id', user.id);
          
        if (error) throw error;
        
        // Convert year to string to match the Vehicle interface
        const formattedData = data?.map(vehicle => ({
          ...vehicle,
          year: vehicle.year.toString() // Convert number to string
        })) || [];
        
        setVehicles(formattedData);
      } catch (error: any) {
        console.error('Error fetching vehicles:', error);
        toast({
          variant: "destructive",
          title: "Failed to load vehicles",
          description: error.message
        });
      } finally {
        setVehiclesLoading(false);
      }
    }
    
    fetchVehicles();
  }, [user, toast]);
  
  const handleAddVehicle = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          owner_id: user.id,
          make: newVehicle.make,
          model: newVehicle.model,
          year: parseInt(newVehicle.year) || new Date().getFullYear(),
          vin: newVehicle.vin,
          vehicle_type: newVehicle.vehicle_type,
          color: newVehicle.color || null,
          license_plate: newVehicle.license_plate || null
        })
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Convert the returned data to match our Vehicle interface
        const addedVehicle: Vehicle = {
          ...data[0],
          year: data[0].year.toString() // Convert year to string
        };
        setVehicles([...vehicles, addedVehicle]);
      }
      
      setNewVehicle({ 
        make: '', 
        model: '', 
        year: '', 
        vin: '', 
        vehicle_type: 'car',
        color: '',
        license_plate: ''
      });
      setDialogOpen(false);
      
      toast({
        title: "Vehicle Added",
        description: "Your vehicle has been added to your profile."
      });
    } catch (error: any) {
      console.error('Error adding vehicle:', error);
      toast({
        variant: "destructive",
        title: "Failed to add vehicle",
        description: error.message
      });
    }
  };
  
  const handleRemoveVehicle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setVehicles(vehicles.filter(vehicle => vehicle.id !== id));
      
      toast({
        title: "Vehicle Removed",
        description: "The vehicle has been removed from your profile."
      });
    } catch (error: any) {
      console.error('Error removing vehicle:', error);
      toast({
        variant: "destructive",
        title: "Failed to remove vehicle",
        description: error.message
      });
    }
  };
  
  if (isLoading || vehiclesLoading) {
    return (
      <Layout portalType="customer">
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }
  
  if (!profileData) {
    return (
      <Layout portalType="customer">
        <div className="text-center py-10">
          <h2 className="text-xl font-medium mb-2">Profile Not Found</h2>
          <p className="text-gray-500 mb-4">Your profile information could not be loaded</p>
          <Button onClick={() => navigate('/customer/login')}>Return to Login</Button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout portalType="customer">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and vehicles.
          </p>
        </div>
        
        <div className="grid gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={`${profileData.first_name || ''} ${profileData.last_name || ''}`} 
                  readOnly 
                  className="bg-gray-50" 
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  value={profileData.email || ''} 
                  readOnly 
                  className="bg-gray-50" 
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={profileData.phone || 'Not provided'} 
                  readOnly 
                  className="bg-gray-50" 
                />
              </div>
            </div>
            
            <div className="mt-4">
              <Button variant="outline" onClick={() => navigate('/auth')}>Edit Profile</Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Vehicles</h2>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-shop-primary hover:bg-shop-primary/90">Add Vehicle</Button>
                </DialogTrigger>
                
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Vehicle</DialogTitle>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="make">Make</Label>
                        <Input 
                          id="make" 
                          value={newVehicle.make} 
                          onChange={(e) => setNewVehicle({...newVehicle, make: e.target.value})}
                          placeholder="Toyota"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="model">Model</Label>
                        <Input 
                          id="model" 
                          value={newVehicle.model} 
                          onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                          placeholder="Camry"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="year">Year</Label>
                        <Input 
                          id="year" 
                          value={newVehicle.year} 
                          onChange={(e) => setNewVehicle({...newVehicle, year: e.target.value})}
                          placeholder="2023"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="vin">VIN</Label>
                        <Input 
                          id="vin" 
                          value={newVehicle.vin} 
                          onChange={(e) => setNewVehicle({...newVehicle, vin: e.target.value})}
                          placeholder="1HGBH41JXMN109186"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      className="bg-shop-primary hover:bg-shop-primary/90" 
                      onClick={handleAddVehicle}
                    >
                      Add Vehicle
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {vehicles.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No vehicles yet. Add your first vehicle to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {vehicles.map((vehicle) => (
                  <div 
                    key={vehicle.id} 
                    className="p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50"
                  >
                    <div>
                      <h3 className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                      <p className="text-sm text-gray-500">VIN: {vehicle.vin || 'Not provided'}</p>
                    </div>
                    
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        // Future implementation: Edit vehicle
                        toast({
                          title: "Coming Soon",
                          description: "Vehicle editing will be available in a future update."
                        });
                      }}>Edit</Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveVehicle(vehicle.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
