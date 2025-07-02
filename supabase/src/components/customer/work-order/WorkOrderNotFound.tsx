
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const WorkOrderNotFound: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-2">Work Order Not Found</h2>
        <p className="mb-4">The work order you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link to="/customer/work-orders">
          <Button>Back to Work Orders</Button>
        </Link>
      </div>
    </div>
  );
};
