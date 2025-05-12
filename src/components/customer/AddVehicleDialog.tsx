import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NewVehicleData } from '@/types/vehicle';

interface AddVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddVehicle: (vehicle: NewVehicleData) => Promise<boolean>;
}

const AddVehicleDialog = ({ open, onOpenChange, onAddVehicle }: AddVehicleDialogProps) => {
  const [newVehicle, setNewVehicle] = useState<NewVehicleData>({
    make: '',
    model: '',
    year: '',
    vin: '',
    vehicle_type: 'car',
    color: '',
    license_plate: ''
  });

  const handleAddVehicle = async () => {
    const success = await onAddVehicle(newVehicle);
    if (success) {
      setNewVehicle({
        make: '', 
        model: '', 
        year: '', 
        vin: '', 
        vehicle_type: 'car',
        color: '',
        license_plate: ''
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
  );
};

export default AddVehicleDialog;
