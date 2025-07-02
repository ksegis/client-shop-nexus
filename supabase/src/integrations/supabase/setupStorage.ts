
import { supabase } from './client';

/**
 * Utility function to set up storage buckets
 * Call this function once when the app initializes
 */
export const setupMessageAttachmentsBucket = async () => {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    
    if (!buckets?.find(bucket => bucket.name === 'message-attachments')) {
      // Create the bucket if it doesn't exist
      const { error } = await supabase.storage.createBucket('message-attachments', {
        public: true, // Make files publicly accessible
      });
      
      if (error) {
        console.error('Error creating message-attachments bucket:', error);
        return false;
      }
      
      console.log('Created message-attachments storage bucket');
      return true;
    }
    
    return true;
  } catch (err) {
    console.error('Storage setup error:', err);
    return false;
  }
};
