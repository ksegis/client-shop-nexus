
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PersonalInfoProps {
  profileData: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

const PersonalInfoCard = ({ profileData }: PersonalInfoProps) => {
  const navigate = useNavigate();

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
      
      <div className="grid md:grid-cols-2 gap-4">
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
      </div>
      
      <div className="mt-4">
        <Button variant="outline" onClick={() => navigate('/auth')}>Edit Profile</Button>
      </div>
    </Card>
  );
};

export default PersonalInfoCard;
