
import React from 'react';

export const WorkOrderSkeleton: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="animate-pulse">
        <div className="h-6 w-1/3 bg-gray-200 rounded mb-4"></div>
        <div className="h-40 bg-gray-200 rounded mb-4"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};
