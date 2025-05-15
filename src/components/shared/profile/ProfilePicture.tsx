
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProfilePictureProps {
  userId: string;
  avatarUrl: string | null;
  firstName?: string | null;
  lastName?: string | null;
  onUploadComplete: (url: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ProfilePicture = ({
  userId,
  avatarUrl,
  firstName,
  lastName,
  onUploadComplete,
  size = 'lg',
}: ProfilePictureProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [hovering, setHovering] = useState(false);

  // Get initials from first and last name
  const getInitials = () => {
    const firstInitial = firstName?.[0] || '';
    const lastInitial = lastName?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase() || 'U';
  };

  // Get avatar size class based on size prop
  const getAvatarSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'h-16 w-16';
      case 'md':
        return 'h-24 w-24';
      case 'lg':
        return 'h-32 w-32';
      case 'xl':
        return 'h-40 w-40';
      default:
        return 'h-32 w-32';
    }
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${Math.random().toString(36).substring(2)}.${fileExt}`;

    setUploading(true);

    try {
      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('profile_pictures')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('profile_pictures')
        .getPublicUrl(filePath);

      // Update the profile with the new avatar URL
      onUploadComplete(urlData.publicUrl);

      toast({
        title: 'Profile picture updated',
        description: 'Your profile picture has been successfully updated.',
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'There was an error uploading your profile picture.',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <Avatar className={`${getAvatarSizeClass()} bg-shop-light`}>
        <AvatarImage src={avatarUrl || undefined} alt="Profile picture" className="object-cover" />
        <AvatarFallback className="text-2xl font-semibold bg-shop-primary text-white">
          {getInitials()}
        </AvatarFallback>
      </Avatar>
      
      <div 
        className={`
          absolute inset-0 flex items-center justify-center rounded-full
          bg-black/50 transition-opacity duration-200 
          ${hovering || uploading ? 'opacity-100' : 'opacity-0'}
        `}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        ) : (
          <>
            <label 
              htmlFor="profilePictureUpload" 
              className="cursor-pointer flex items-center justify-center h-full w-full"
            >
              <Camera className="h-8 w-8 text-white" />
              <input 
                type="file" 
                id="profilePictureUpload" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload} 
              />
            </label>
          </>
        )}
      </div>
      
      {avatarUrl && !uploading && (
        <Button 
          variant="destructive" 
          size="icon" 
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full" 
          onClick={() => onUploadComplete('')}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};
