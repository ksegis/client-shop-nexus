
import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { vehicleSchema, VehicleFormValues } from './VehicleFormSchema';
import { Vehicle } from '@/types/vehicle';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Camera, Trash2 } from 'lucide-react';
import { VehicleForm } from './form/VehicleForm';

interface EditVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
  onSubmit: (id: string, data: Partial<Vehicle>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, vehicleId: string) => Promise<void>;
  uploadingImage: boolean;
}

export const EditVehicleDialog: React.FC<EditVehicleDialogProps> = ({ 
  open, 
  onOpenChange, 
  vehicle, 
  onSubmit, 
  onDelete,
  onImageUpload,
  uploadingImage
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: '',
      model: '',
      year: '',
      vehicle_type: 'car',
      vin: '',
      license_plate: '',
      color: '',
      mileage: '',
    }
  });
  
  useEffect(() => {
    if (vehicle) {
      form.reset({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year.toString(),
        vehicle_type: vehicle.vehicle_type,
        vin: vehicle.vin || '',
        license_plate: vehicle.license_plate || '',
        color: vehicle.color || '',
        mileage: vehicle.mileage ? vehicle.mileage.toString() : '',
      });
    }
  }, [vehicle, form]);
  
  const handleSubmit = async (data: VehicleFormValues) => {
    if (!vehicle) return;
    
    try {
      setIsSubmitting(true);
      await onSubmit(vehicle.id, {
        make: data.make,
        model: data.model,
        year: Number(data.year),
        vehicle_type: data.vehicle_type,
        vin: data.vin || undefined,
        color: data.color || undefined,
        license_plate: data.license_plate || undefined,
        mileage: data.mileage ? Number(data.mileage) : undefined,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!vehicle) return;
    
    try {
      setIsDeleting(true);
      await onDelete(vehicle.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleCancel = () => {
    onOpenChange(false);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (vehicle) {
      onImageUpload(e, vehicle.id);
    }
  };
  
  if (!vehicle) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
          <DialogDescription>
            Update your vehicle details below.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <VehicleForm 
              form={form}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              submitButtonText="Update Vehicle"
            />
            
            <div className="flex justify-start mt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Vehicle</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your vehicle and all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete} 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>
          
          <TabsContent value="images" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {vehicle.images && vehicle.images.length > 0 ? (
                vehicle.images.map((image, index) => (
                  <div key={index} className="relative border rounded-md overflow-hidden">
                    <img 
                      src={image} 
                      alt={`Vehicle image ${index + 1}`} 
                      className="w-full h-32 object-cover"
                    />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-8 text-center border rounded-md">
                  <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No images yet</p>
                </div>
              )}
            </div>
            
            <Form {...form}>
              <form className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label 
                    htmlFor="vehicle-image" 
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-accent/50"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF (MAX. 5MB)</p>
                    </div>
                    <Input 
                      id="vehicle-image" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileChange}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                {uploadingImage && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground animate-pulse">Uploading image...</p>
                  </div>
                )}
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
