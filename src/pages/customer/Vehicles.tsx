import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useVehicles } from '@/hooks/useVehicles';
import { useVehicleImages } from '@/hooks/vehicles/useVehicleImages';
import { Vehicle, NewVehicleData } from '@/types/vehicle';
import { VehiclesList } from '@/components/vehicles/VehiclesList';
import { AddVehicleDialog } from '@/components/vehicles/AddVehicleDialog';
import { EditVehicleDialog } from '@/components/vehicles/EditVehicleDialog';

const CustomerVehicles = () => {
  const { vehicles, loading, addVehicle, updateVehicle, deleteVehicle } = useVehicles();
  const { uploadVehicleImage } = useVehicleImages();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
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
    setIsAddDialogOpen(true);
  };
  
  // Handle opening edit dialog
  const openEditDialog = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsEditDialogOpen(true);
  };
  
  // Handle adding a vehicle
  const handleAddVehicle = async (data: NewVehicleData) => {
    try {
      await addVehicle(data);
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
    }
  };
  
  // Handle updating a vehicle
  const handleUpdateVehicle = async (id: string, data: Partial<NewVehicleData>) => {
    try {
      await updateVehicle(id, data);
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
    }
  };
  
  // Handle deleting a vehicle
  const handleDeleteVehicle = async (id: string) => {
    try {
      await deleteVehicle(id);
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
      
      <VehiclesList
        vehicles={vehicles}
        loading={loading}
        onManage={openEditDialog}
        onAddNew={openAddDialog}
      />
      
      <AddVehicleDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddVehicle}
      />
      
      <EditVehicleDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        vehicle={selectedVehicle}
        onSubmit={handleUpdateVehicle}
        onDelete={handleDeleteVehicle}
        onImageUpload={handleFileUpload}
        uploadingImage={uploadingImage}
      />
    </div>
  );
};

export default CustomerVehicles;
