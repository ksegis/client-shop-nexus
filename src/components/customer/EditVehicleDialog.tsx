import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Vehicle } from '@/types/vehicle';

interface EditVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle;
  onUpdateVehicle: (id: string, vehicleData: Partial<Vehicle>) => Promise<boolean>;
}

const EditVehicleDialog = ({ open, onOpenChange, vehicle, onUpdateVehicle }: EditVehicleDialogProps) => {
  const [vehicleData, setVehicleData] = useState<Partial<Vehicle>>({
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    vin: vehicle.vin,
    vehicle_type: vehicle.vehicle_type,
    color: vehicle.color,
    license_plate: vehicle.license_plate
  });

  const handleUpdateVehicle = async () => {
    const success = await onUpdateVehicle(vehicle.id, vehicleData);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="make">Make</Label>
              <Input 
                id="make" 
                value={vehicleData.make} 
                onChange={(e) => setVehicleData({...vehicleData, make: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="model">Model</Label>
              <Input 
                id="model" 
                value={vehicleData.model} 
                onChange={(e) => setVehicleData({...vehicleData, model: e.target.value})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Year</Label>
              <Input 
                id="year" 
                value={vehicleData.year} 
                onChange={(e) => setVehicleData({...vehicleData, year: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="vin">VIN</Label>
              <Input 
                id="vin" 
                value={vehicleData.vin || ''} 
                onChange={(e) => setVehicleData({...vehicleData, vin: e.target.value})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="color">Color</Label>
              <Input 
                id="color" 
                value={vehicleData.color || ''} 
                onChange={(e) => setVehicleData({...vehicleData, color: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="license_plate">License Plate</Label>
              <Input 
                id="license_plate" 
                value={vehicleData.license_plate || ''} 
                onChange={(e) => setVehicleData({...vehicleData, license_plate: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="vehicle_type">Vehicle Type</Label>
            <Select 
              value={vehicleData.vehicle_type} 
              onValueChange={(value: 'car' | 'truck' | 'motorcycle' | 'other') => 
                setVehicleData({...vehicleData, vehicle_type: value})
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="car">Car</SelectItem>
                <SelectItem value="truck">Truck</SelectItem>
                <SelectItem value="motorcycle">Motorcycle</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            className="bg-shop-primary hover:bg-shop-primary/90" 
            onClick={handleUpdateVehicle}
          >
            Update Vehicle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditVehicleDialog;
