
import React, { useState } from 'react';
import { useVehicles } from '@/hooks/useVehicles';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/components/ui/use-toast';
import { Car, PlusCircle, Trash2 } from 'lucide-react';
import { useVehicleImages } from '@/hooks/vehicles/useVehicleImages';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const vehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.string()
    .min(4, 'Year must be 4 digits')
    .max(4, 'Year must be 4 digits')
    .refine(val => !isNaN(Number(val)) && Number(val) >= 1900 && Number(val) <= new Date().getFullYear() + 1, {
      message: `Year must be between 1900 and ${new Date().getFullYear() + 1}`
    }),
  vin: z.string().optional(),
  license_plate: z.string().optional(),
  color: z.string().optional(),
  vehicle_type: z.enum(['car', 'truck', 'motorcycle', 'other']),
  mileage: z.string().optional().refine(val => !val || !isNaN(Number(val)), {
    message: 'Mileage must be a number'
  }),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

const CustomerVehicles = () => {
  const { vehicles, loading, addVehicle, updateVehicle, deleteVehicle } = useVehicles();
  const { uploadVehicleImage, removeVehicleImage } = useVehicleImages();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Form for adding a vehicle
  const addForm = useForm<VehicleFormValues>({
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
  
  // Form for editing a vehicle
  const editForm = useForm<VehicleFormValues>({
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
  
  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, vehicleId: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    try {
      setUploadingImage(true);
      await uploadVehicleImage(vehicleId, file);
      toast({
        title: "Image uploaded",
        description: "Vehicle image has been uploaded successfully.",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was a problem uploading your image.",
      });
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Handle opening add dialog
  const openAddDialog = () => {
    addForm.reset();
    setIsAddDialogOpen(true);
  };
  
  // Handle opening edit dialog
  const openEditDialog = (vehicle: any) => {
    editForm.reset({
      make: vehicle.make,
      model: vehicle.model,
      year: String(vehicle.year),
      vehicle_type: vehicle.vehicle_type || 'car',
      vin: vehicle.vin || '',
      license_plate: vehicle.license_plate || '',
      color: vehicle.color || '',
      mileage: vehicle.mileage ? String(vehicle.mileage) : '',
    });
    setSelectedVehicle(vehicle);
    setIsEditDialogOpen(true);
  };
  
  // Handle adding a vehicle
  const handleAddVehicle = async (data: VehicleFormValues) => {
    try {
      setIsSubmitting(true);
      await addVehicle({
        ...data,
        year: Number(data.year),
        mileage: data.mileage ? Number(data.mileage) : undefined,
      });
      setIsAddDialogOpen(false);
      toast({
        title: "Vehicle added",
        description: "Your vehicle has been added successfully.",
      });
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast({
        variant: "destructive",
        title: "Add failed",
        description: "There was a problem adding your vehicle.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle updating a vehicle
  const handleUpdateVehicle = async (data: VehicleFormValues) => {
    if (!selectedVehicle) return;
    
    try {
      setIsSubmitting(true);
      await updateVehicle(selectedVehicle.id, {
        ...data,
        year: Number(data.year),
        mileage: data.mileage ? Number(data.mileage) : undefined,
      });
      setIsEditDialogOpen(false);
      toast({
        title: "Vehicle updated",
        description: "Your vehicle has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was a problem updating your vehicle.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle deleting a vehicle
  const handleDeleteVehicle = async (id: string) => {
    try {
      await deleteVehicle(id);
      setIsEditDialogOpen(false);
      toast({
        title: "Vehicle removed",
        description: "Your vehicle has been removed successfully.",
      });
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "There was a problem removing your vehicle.",
      });
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Vehicles</h1>
        <Button onClick={openAddDialog} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" /> Add Vehicle
        </Button>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : vehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map(vehicle => (
            <Card key={vehicle.id} className="overflow-hidden">
              <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                {vehicle.images && vehicle.images[0] ? (
                  <AspectRatio ratio={16/9}>
                    <img 
                      src={vehicle.images[0]} 
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="object-cover w-full h-full"
                    />
                  </AspectRatio>
                ) : (
                  <Car className="h-20 w-20 text-gray-300" />
                )}
              </div>
              <CardContent className="p-6">
                <CardTitle className="text-xl mb-2">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </CardTitle>
                <div className="text-sm text-gray-500 space-y-1">
                  {vehicle.vehicle_type && (
                    <p className="capitalize">Type: {vehicle.vehicle_type}</p>
                  )}
                  {vehicle.color && (
                    <p>Color: {vehicle.color}</p>
                  )}
                  {vehicle.mileage && (
                    <p>Mileage: {vehicle.mileage.toLocaleString()} miles</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="px-6 pb-6 pt-0">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => openEditDialog(vehicle)}
                >
                  Manage Vehicle
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center p-10">
          <div className="flex flex-col items-center justify-center p-6">
            <Car className="h-16 w-16 text-gray-300 mb-4" />
            <CardTitle className="text-xl mb-2">No vehicles added yet</CardTitle>
            <CardDescription className="mb-4">
              Add your vehicles to receive personalized service and maintenance recommendations
            </CardDescription>
            <Button onClick={openAddDialog}>Add Your First Vehicle</Button>
          </div>
        </Card>
      )}
      
      {/* Add Vehicle Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>
              Enter your vehicle details. This helps us provide better service for your specific vehicle.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddVehicle)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Ford" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. F-150" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 2022" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="vehicle_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="car">Car</SelectItem>
                          <SelectItem value="truck">Truck</SelectItem>
                          <SelectItem value="motorcycle">Motorcycle</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Blue" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mileage</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 45000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="vin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VIN</FormLabel>
                      <FormControl>
                        <Input placeholder="Vehicle Identification Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="license_plate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Plate</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. ABC123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Vehicle'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Vehicle Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>
              Update your vehicle details or upload an image.
            </DialogDescription>
          </DialogHeader>
          {selectedVehicle && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdateVehicle)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="vehicle_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="car">Car</SelectItem>
                            <SelectItem value="truck">Truck</SelectItem>
                            <SelectItem value="motorcycle">Motorcycle</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="mileage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mileage</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="vin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VIN</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="license_plate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Plate</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Vehicle Image Upload */}
                <div>
                  <FormLabel>Vehicle Image</FormLabel>
                  <div className="mt-1 flex items-center gap-4">
                    <div className="h-16 w-16 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                      {selectedVehicle.images && selectedVehicle.images[0] ? (
                        <img 
                          src={selectedVehicle.images[0]} 
                          alt={`${selectedVehicle.make} ${selectedVehicle.model}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Car className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, selectedVehicle.id)}
                      disabled={uploadingImage}
                      className="max-w-sm"
                    />
                  </div>
                </div>
                
                <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={() => handleDeleteVehicle(selectedVehicle.id)}
                    className="sm:mr-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Vehicle
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerVehicles;
