
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useProfileData } from '@/hooks/useProfileData';

interface PersonalInfoProps {
  profileData: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

const PersonalInfoCard = ({ profileData }: PersonalInfoProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: profileData.first_name || '',
    last_name: profileData.last_name || '',
    phone: profileData.phone || '',
  });
  const { updateProfileData, refreshProfile } = useProfileData();
  const { toast } = useToast();

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

  return (
    <Card className="p-6">
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
                });
              }}
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

export default PersonalInfoCard;
