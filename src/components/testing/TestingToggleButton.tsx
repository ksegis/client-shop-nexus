
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bug, Check } from 'lucide-react';
import { useTesting } from '@/contexts/testing';
import { useNavigate } from 'react-router-dom';

export const TestingToggleButton: React.FC = () => {
  const navigate = useNavigate();
  
  // Try to access the testing context, but don't throw if not available
  let testingContext;
  try {
    testingContext = useTesting();
  } catch (error) {
    // If TestingProvider is not available, render a simplified button
    // that just navigates to the testing page
    return (
      <Button 
        variant="outline"
        className="flex items-center gap-1"
        onClick={() => navigate('/testing')}
      >
        <Bug className="h-4 w-4" /> Testing
      </Button>
    );
  }

  const { isTestingEnabled, enableTesting, disableTesting } = testingContext;

  const handleClick = () => {
    if (isTestingEnabled) {
      navigate('/testing');
    } else {
      enableTesting();
      navigate('/testing');
    }
  };

  return (
    <Button 
      variant={isTestingEnabled ? "default" : "outline"}
      className={`flex items-center gap-1 ${isTestingEnabled ? 'bg-green-600 hover:bg-green-700' : ''}`}
      onClick={handleClick}
    >
      {isTestingEnabled ? (
        <>
          <Check className="h-4 w-4" /> Testing
        </>
      ) : (
        <>
          <Bug className="h-4 w-4" /> Testing
        </>
      )}
    </Button>
  );
};
