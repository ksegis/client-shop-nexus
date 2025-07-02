
import React from 'react';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Camera, Trash2, Upload } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { VehicleFormValues } from '../VehicleFormSchema';
import { Vehicle } from '@/types/vehicle';

interface VehicleImageTabProps {
  form: UseFormReturn<VehicleFormValues>;
  vehicle: Vehicle;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, vehicleId: string) => Promise<void>;
  uploadingImage: boolean;
  onImageDelete?: (vehicleId: string, imageUrl: string) => Promise<void>;
}

export const VehicleImageTab: React.FC<VehicleImageTabProps> = ({
  form,
  vehicle,
  onImageUpload,
  uploadingImage,
  onImageDelete
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onImageUpload(e, vehicle.id);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {vehicle.images && vehicle.images.length > 0 ? (
          vehicle.images.map((image, index) => (
            <div key={index} className="relative border rounded-md overflow-hidden">
              <img 
                src={image} 
                alt={`Vehicle image ${index + 1}`} 
                className="w-full h-32 object-cover"
              />
              {onImageDelete && (
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2"
                  onClick={() => onImageDelete(vehicle.id, image)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
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
    </div>
  );
};
