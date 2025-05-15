
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Calendar, CheckCircle2, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ServiceUpdate } from '@/hooks/work-orders/useServiceUpdates';
import { Skeleton } from '@/components/ui/skeleton';

interface ServiceUpdatesListProps {
  updates: ServiceUpdate[];
  loading: boolean;
  isShopPortal?: boolean;
}

export const ServiceUpdatesList: React.FC<ServiceUpdatesListProps> = ({ 
  updates,
  loading,
  isShopPortal = true
}) => {
  // Format the date using date-fns
  const formatUpdateDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      console.error('Invalid date format:', dateString, error);
      return 'Unknown date';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-slate-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
              <div className="mt-3">
                <Skeleton className="h-5 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Updates Yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          There are no service updates for this work order yet.
        </p>
        {isShopPortal && (
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Update
              <MessageSquare className="ml-2 -mr-1 h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {updates.map((update, index) => (
        <Card key={update.id || index} className="bg-slate-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {update.milestone && (
                  <>
                    {update.milestone_completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-blue-500" />
                    )}
                    <span className="font-medium">
                      {update.milestone}
                    </span>
                  </>
                )}
              </div>
              <span className="text-xs text-gray-500 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatUpdateDate(update.date || update.created_at)}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 whitespace-pre-line">{update.content}</p>
            
            {update.images && update.images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {update.images.map((image, i) => (
                  <div key={i} className="h-16 w-16 rounded overflow-hidden bg-gray-100">
                    <img 
                      src={image} 
                      alt={`Update image ${i+1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
