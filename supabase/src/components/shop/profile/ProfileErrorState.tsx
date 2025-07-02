
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

type ProfileErrorStateProps = {
  errorMessage: string;
  onRefresh: () => void;
};

const ProfileErrorState = ({ errorMessage, onRefresh }: ProfileErrorStateProps) => {
  return (
    <div className="max-w-3xl mx-auto p-4 bg-red-50 rounded-md border border-red-200">
      <h1 className="text-2xl font-bold mb-2 text-red-600">Error Loading Profile</h1>
      <p className="text-gray-700">{errorMessage}</p>
      <div className="flex gap-2 mt-4">
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
        <Button 
          variant="outline" 
          onClick={onRefresh}
          className="flex items-center gap-1"
        >
          <RefreshCcw className="h-4 w-4" /> Refresh Profile
        </Button>
      </div>
    </div>
  );
};

export default ProfileErrorState;
