
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NewVehicleData } from '@/types/vehicle';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface AddVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddVehicle: (vehicle: NewVehicleData, customerId?: string) => Promise<boolean>;
  customerId?: string; // Add this prop to specify the customer when adding as shop staff
}

const AddVehicleDialog = ({ 
  open, 
  onOpenChange, 
  onAddVehicle, 
  customerId 
}: AddVehicleDialogProps) => {
  const [newVehicle, setNewVehicle] = useState<NewVehicleData>({
    make: '',
    model: '',
    year: '',
    vin: '',
    vehicle_type: 'car',
    color: '',
    license_plate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAddVehicle = async () => {
    if (!newVehicle.make || !newVehicle.model || !newVehicle.year) {
      toast({
        title: 'Validation Error',
        description: 'Make, model, and year are required fields.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Adding vehicle:', newVehicle, customerId ? `for customer: ${customerId}` : '');
      const success = await onAddVehicle(newVehicle, customerId);
      
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
    } catch (error: any) {
      console.error('Error adding vehicle:', error);
      toast({
        title: 'Error adding vehicle',
        description: error.message || 'Please try again later',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="color">Color</Label>
              <Input 
                id="color" 
                value={newVehicle.color || ''} 
                onChange={(e) => setNewVehicle({...newVehicle, color: e.target.value})}
                placeholder="Blue"
              />
            </div>
            
            <div>
              <Label htmlFor="license_plate">License Plate</Label>
              <Input 
                id="license_plate" 
                value={newVehicle.license_plate || ''} 
                onChange={(e) => setNewVehicle({...newVehicle, license_plate: e.target.value})}
                placeholder="ABC123"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="vehicle_type">Vehicle Type</Label>
            <Select 
              value={newVehicle.vehicle_type} 
              onValueChange={(value) => setNewVehicle({
                ...newVehicle, 
                vehicle_type: value as 'car' | 'truck' | 'motorcycle' | 'other'
              })}
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
            onClick={handleAddVehicle}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Vehicle'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVehicleDialog;
