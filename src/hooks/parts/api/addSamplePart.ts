
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Function to add a sample part for testing
export const addSamplePart = async (toast: ReturnType<typeof useToast>['toast']) => {
  try {
    const samplePart = {
      name: "Sample Brake Pad",
      description: "High-quality brake pads for heavy-duty trucks",
      sku: "BP-12345",
      category: "Brakes",
      supplier: "BrakeMaster",
      price: 89.99,
      cost: 45.50,
      quantity: 25,
      reorder_level: 10
    };

    const { data, error } = await supabase
      .from('inventory')
      .insert(samplePart)
      .select();

    if (error) throw error;
    
    toast({
      title: "Sample part added",
      description: "A sample part has been added to inventory for testing.",
    });
    
    return data;
  } catch (err) {
    console.error('Error adding sample part:', err);
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to add sample part to inventory.",
    });
    return null;
  }
};
