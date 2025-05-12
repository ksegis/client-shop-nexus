
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useProfileData } from '@/hooks/useProfileData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Facebook, Twitter, Instagram, Linkedin, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PersonalInfoProps {
  profileData: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url?: string | null;
    facebook_url?: string | null;
    twitter_url?: string | null;
    instagram_url?: string | null;
    linkedin_url?: string | null;
  };
}

const PersonalInfoCard = ({ profileData }: PersonalInfoProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: profileData.first_name || '',
    last_name: profileData.last_name || '',
    phone: profileData.phone || '',
    facebook_url: profileData.facebook_url || '',
    twitter_url: profileData.twitter_url || '',
    instagram_url: profileData.instagram_url || '',
    linkedin_url: profileData.linkedin_url || '',
  });
  const { updateProfileData, refreshProfile } = useProfileData();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      await updateProfileData({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        facebook_url: formData.facebook_url || null,
        twitter_url: formData.twitter_url || null,
        instagram_url: formData.instagram_url || null,
        linkedin_url: formData.linkedin_url || null,
      });
      
      toast({
        title: 'Profile updated',
        description: 'Your profile information has been updated successfully.',
      });
      
      setIsEditing(false);
      await refreshProfile();
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    try {
      setUploading(true);
      
      // Check if profiles_storage bucket exists, if not we'll handle this as if it's a new profile without an image
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('profiles_storage');
      if (bucketError) {
        console.log('Bucket does not exist or other error:', bucketError);
        toast({
          title: 'Storage not configured',
          description: 'Profile image storage is not configured yet.',
          variant: 'destructive',
        });
        setUploading(false);
        return;
      }
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('profiles_storage')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('profiles_storage')
        .getPublicUrl(filePath);
      
      // Update profile with new avatar URL
      await updateProfileData({
        avatar_url: urlData.publicUrl,
      });
      
      toast({
        title: 'Profile picture updated',
        description: 'Your profile picture has been updated successfully.',
      });
      
      await refreshProfile();
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row md:items-start gap-6 mb-6">
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="h-24 w-24 mb-2">
              <AvatarImage src={profileData.avatar_url || ''} alt={`${profileData.first_name} ${profileData.last_name}`} />
              <AvatarFallback className="bg-shop-light text-shop-primary text-lg">
                {profileData.first_name?.[0]}{profileData.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow cursor-pointer border border-gray-200 hover:bg-gray-50">
              <Camera className="h-4 w-4 text-gray-500" />
              <input 
                type="file" 
                id="avatar-upload" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={uploading} 
              />
            </label>
          </div>
          <p className="text-sm text-gray-500 text-center mt-2">Click the camera icon to upload a profile picture</p>
        </div>
        
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {!isEditing ? (
              <>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={`${profileData.first_name || ''} ${profileData.last_name || ''}`} 
                    readOnly 
                    className="bg-gray-50" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    value={profileData.email || ''} 
                    readOnly 
                    className="bg-gray-50" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={profileData.phone || 'Not provided'} 
                    readOnly 
                    className="bg-gray-50" 
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input 
                    id="first_name"
                    name="first_name"
                    value={formData.first_name} 
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input 
                    id="last_name" 
                    name="last_name"
                    value={formData.last_name} 
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    value={profileData.email || ''} 
                    readOnly 
                    className="bg-gray-50" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone"
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-3">Social Media</h3>
            
            {!isEditing ? (
              <div className="flex flex-wrap gap-4">
                {profileData.facebook_url && (
                  <a href={profileData.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-shop-primary hover:underline">
                    <Facebook className="h-4 w-4" /> Facebook
                  </a>
                )}
                
                {profileData.twitter_url && (
                  <a href={profileData.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-shop-primary hover:underline">
                    <Twitter className="h-4 w-4" /> Twitter
                  </a>
                )}
                
                {profileData.instagram_url && (
                  <a href={profileData.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-shop-primary hover:underline">
                    <Instagram className="h-4 w-4" /> Instagram
                  </a>
                )}
                
                {profileData.linkedin_url && (
                  <a href={profileData.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-shop-primary hover:underline">
                    <Linkedin className="h-4 w-4" /> LinkedIn
                  </a>
                )}
                
                {!profileData.facebook_url && !profileData.twitter_url && 
                 !profileData.instagram_url && !profileData.linkedin_url && (
                  <span className="text-gray-500">No social media links provided</span>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="facebook_url" className="flex items-center gap-1">
                    <Facebook className="h-4 w-4" /> Facebook URL
                  </Label>
                  <Input 
                    id="facebook_url"
                    name="facebook_url"
                    value={formData.facebook_url} 
                    onChange={handleChange}
                    placeholder="https://facebook.com/username"
                  />
                </div>
                
                <div>
                  <Label htmlFor="twitter_url" className="flex items-center gap-1">
                    <Twitter className="h-4 w-4" /> Twitter URL
                  </Label>
                  <Input 
                    id="twitter_url"
                    name="twitter_url"
                    value={formData.twitter_url} 
                    onChange={handleChange}
                    placeholder="https://twitter.com/username"
                  />
                </div>
                
                <div>
                  <Label htmlFor="instagram_url" className="flex items-center gap-1">
                    <Instagram className="h-4 w-4" /> Instagram URL
                  </Label>
                  <Input 
                    id="instagram_url"
                    name="instagram_url"
                    value={formData.instagram_url} 
                    onChange={handleChange}
                    placeholder="https://instagram.com/username"
                  />
                </div>
                
                <div>
                  <Label htmlFor="linkedin_url" className="flex items-center gap-1">
                    <Linkedin className="h-4 w-4" /> LinkedIn URL
                  </Label>
                  <Input 
                    id="linkedin_url"
                    name="linkedin_url"
                    value={formData.linkedin_url} 
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            {!isEditing ? (
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button 
                  variant="default" 
                  onClick={handleSubmit}
                >
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      first_name: profileData.first_name || '',
                      last_name: profileData.last_name || '',
                      phone: profileData.phone || '',
                      facebook_url: profileData.facebook_url || '',
                      twitter_url: profileData.twitter_url || '',
                      instagram_url: profileData.instagram_url || '',
                      linkedin_url: profileData.linkedin_url || '',
                    });
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PersonalInfoCard;
