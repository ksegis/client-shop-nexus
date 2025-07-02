
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

type ProfileNotFoundStateProps = {
  onRefresh: () => void;
};

const ProfileNotFoundState = ({ onRefresh }: ProfileNotFoundStateProps) => {
  return (
    <div className="max-w-3xl mx-auto p-4 bg-amber-50 rounded-md border border-amber-200">
      <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
      <p className="text-gray-700">We couldn't find your profile information.</p>
      <div className="flex gap-2 mt-4">
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </Button>
        <Button 
          variant="default"
          onClick={onRefresh}
          className="flex items-center gap-1"
        >
          <RefreshCcw className="h-4 w-4" /> Try to Create Profile
        </Button>
      </div>
    </div>
  );
};

export default ProfileNotFoundState;
