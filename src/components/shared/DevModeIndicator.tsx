
import React from 'react';
import { Bug } from 'lucide-react';

export const DevModeIndicator = () => {
  // Only show in development mode
  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-md bg-yellow-100 px-3 py-2 text-xs font-medium text-yellow-800 shadow-md border border-yellow-300">
      <Bug size={16} />
      <span>Development Mode</span>
    </div>
  );
};
