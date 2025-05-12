
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useProfileData } from '@/hooks/useProfileData';
import { useVehicleManagement } from '@/hooks/useVehicleManagement';
import { Loader2 } from 'lucide-react';
import PersonalInfoCard from '@/components/customer/PersonalInfoCard';
import VehiclesCard from '@/components/customer/VehiclesCard';

const ProfilePage = () => {
  const { profileData, isLoading } = useProfileData();
  const { vehicles, loading: vehiclesLoading, addVehicle, updateVehicle, removeVehicle } = useVehicleManagement();
  const navigate = useNavigate();
  
  if (isLoading || vehiclesLoading) {
    return (
      <Layout portalType="customer">
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }
  
  if (!profileData) {
    return (
      <Layout portalType="customer">
        <div className="text-center py-10">
          <h2 className="text-xl font-medium mb-2">Profile Not Found</h2>
          <p className="text-gray-500 mb-4">Your profile information could not be loaded</p>
          <button onClick={() => navigate('/customer/login')} className="px-4 py-2 bg-primary text-white rounded">
            Return to Login
          </button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout portalType="customer">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and vehicles.
          </p>
        </div>
        
        <div className="grid gap-6">
          <PersonalInfoCard profileData={profileData} />
          
          <VehiclesCard
            vehicles={vehicles}
            loading={vehiclesLoading}
            onAddVehicle={addVehicle}
            onUpdateVehicle={updateVehicle}
            onRemoveVehicle={removeVehicle}
          />
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
