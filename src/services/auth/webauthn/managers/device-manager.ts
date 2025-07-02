
import { supabase } from '@/lib/supabase';

// Define a proper interface for trusted devices
interface TrustedDevice {
  id?: string;
  user_id?: string;
  device_hash: string;
  created_at?: string;
  last_active?: string;
  ip_address?: string;
  user_agent?: string;
  is_active?: boolean;
  trusted_until?: string;
}

class DeviceManager {
  /**
   * Trust a device for a user
   * @param userId User ID or email
   * @param deviceHash Device hash to trust
   * @returns 
   */
  async trustDevice(userId: string, deviceHash: string) {
    try {
      // Calculate expiration date (30 days from now)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      
      // If userId is an email, get the actual user ID
      let actualUserId = userId;
      if (userId.includes('@')) {
        // Fetch user by email
        const { data: userData, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', userId)
          .single();
          
        if (userData) {
          actualUserId = userData.id;
        } else {
          console.error('User not found with email:', userId);
          return false;
        }
      }
      
      // Check if there's already a record for this device
      const { data: existingDevice } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', actualUserId)
        .eq('device_hash', deviceHash)
        .single();
        
      if (existingDevice) {
        // Update the existing device
        const { error } = await supabase
          .from('user_sessions')
          .update({
            is_active: true,
            last_active: new Date().toISOString(),
            trusted_until: expirationDate.toISOString()
          })
          .eq('id', existingDevice.id);
          
        return !error;
      } else {
        // Create a new trusted device record
        const { error } = await supabase
          .from('user_sessions')
          .insert({
            user_id: actualUserId,
            device_hash: deviceHash,
            is_active: true,
            user_agent: navigator.userAgent,
            trusted_until: expirationDate.toISOString()
          });
          
        return !error;
      }
    } catch (error) {
      console.error('Error trusting device:', error);
      return false;
    }
  }
  
  /**
   * Check if a device is trusted for a user
   * @param userId User ID
   * @param deviceHash Device hash to check
   * @returns 
   */
  async isDeviceTrusted(userId: string, deviceHash: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('device_hash', deviceHash)
        .eq('is_active', true)
        .single();
        
      if (error || !data) {
        return false;
      }
      
      // Check if trust has expired - using safe property access with type assertion
      const deviceData = data as TrustedDevice;
      if (deviceData.trusted_until) {
        const trustExpiration = new Date(deviceData.trusted_until);
        if (trustExpiration < new Date()) {
          // Trust has expired
          return false;
        }
      } else {
        // No expiration date means it's not trusted
        return false;
      }
      
      // Update last active time
      await supabase
        .from('user_sessions')
        .update({ last_active: new Date().toISOString() })
        .eq('id', data.id);
        
      return true;
    } catch (error) {
      console.error('Error checking trusted device:', error);
      return false;
    }
  }
}

export const deviceManager = new DeviceManager();
