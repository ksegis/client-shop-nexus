
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Loader2 } from 'lucide-react';

const ProfileLoadingState = () => {
  return (
    <div className="flex justify-center items-center h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-shop-primary" />
    </div>
  );
};

export default ProfileLoadingState;
