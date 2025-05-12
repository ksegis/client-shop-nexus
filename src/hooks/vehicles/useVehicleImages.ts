
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export const useVehicleImages = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadVehicleImage = async (vehicleId: string, file: File) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${vehicleId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `vehicle-images/${fileName}`;
      
      // Check if vehicle_images bucket exists, if not handle gracefully
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('vehicle_images');
      if (bucketError) {
        console.log('Bucket does not exist or other error:', bucketError);
        toast({
          title: 'Storage not configured',
          description: 'Vehicle image storage is not configured yet.',
          variant: 'destructive',
        });
        return null;
      }
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('vehicle_images')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('vehicle_images')
        .getPublicUrl(filePath);
      
      // Get current vehicle images
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('images')
        .eq('id', vehicleId)
        .single();
      
      if (vehicleError) throw vehicleError;
      
      // Update vehicle with new image URL
      const images = vehicleData.images || [];
      images.push(urlData.publicUrl);
      
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ images })
        .eq('id', vehicleId);
      
      if (updateError) throw updateError;
      
      toast({
        title: 'Image uploaded',
        description: 'Vehicle image uploaded successfully',
      });
      
      return urlData.publicUrl;
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const removeVehicleImage = async (vehicleId: string, imageUrl: string) => {
    try {
      // Get current vehicle images
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('images')
        .eq('id', vehicleId)
        .single();
      
      if (vehicleError) throw vehicleError;
      
      // Update vehicle with new image URLs (remove the selected one)
      const images = (vehicleData.images || []).filter(url => url !== imageUrl);
      
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ images })
        .eq('id', vehicleId);
      
      if (updateError) throw updateError;
      
      toast({
        title: 'Image removed',
        description: 'Vehicle image removed successfully',
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: 'Remove image failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    uploadVehicleImage,
    removeVehicleImage
  };
};
