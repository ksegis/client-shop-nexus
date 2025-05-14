
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const WorkOrderNotFound: React.FC = () => {
  return (
    <div className="container mx-auto p-4 flex justify-center items-center h-64">
      <div className="text-center">
        <h2 className="text-lg font-medium mb-2">Work Order Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested work order could not be found.</p>
        <Button asChild variant="outline">
          <Link to="/shop/work-orders">Back to Work Orders</Link>
        </Button>
      </div>
    </div>
  );
};

export default WorkOrderNotFound;
