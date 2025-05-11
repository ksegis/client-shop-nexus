
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: string;
  vin: string;
}

const ProfilePage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: '1', make: 'Toyota', model: 'Camry', year: '2019', vin: '1HGBH41JXMN109186' },
    { id: '2', make: 'Honda', model: 'Accord', year: '2020', vin: '5FNRL38755B024633' }
  ]);
  
  const [newVehicle, setNewVehicle] = useState<Omit<Vehicle, 'id'>>({
    make: '',
    model: '',
    year: '',
    vin: ''
  });
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const handleAddVehicle = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const vehicle = { ...newVehicle, id };
    
    setVehicles([...vehicles, vehicle]);
    setNewVehicle({ make: '', model: '', year: '', vin: '' });
    setDialogOpen(false);
    
    toast({
      title: "Vehicle Added",
      description: "Your vehicle has been added to your profile."
    });
    
    // Integration placeholder
    console.log('<!-- TODO: POST vehicle data via GHL webhook → Zapier → Supabase -->');
  };
  
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
            
            {/* Personal Information - Hardcoded for demo */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value="John Doe" readOnly className="bg-gray-50" />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value="john.doe@example.com" readOnly className="bg-gray-50" />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value="(555) 123-4567" readOnly className="bg-gray-50" />
              </div>
            </div>
            
            {/* Integration placeholder comment */}
            {/* <!-- TODO: fetch customer data via GHL webhook → Zapier → Supabase --> */}
            
            <div className="mt-4">
              <Button variant="outline">Edit Profile</Button>
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
                      <p className="text-sm text-gray-500">VIN: {vehicle.vin}</p>
                    </div>
                    
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700">
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Integration placeholder comment */}
            {/* <!-- TODO: fetch vehicles via GHL webhook → Zapier → Supabase --> */}
            {/* <!-- TODO: POST vehicle updates via GHL webhook --> */}
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
