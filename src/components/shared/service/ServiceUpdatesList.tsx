
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ServiceUpdate } from '@/hooks/work-orders/useServiceUpdates';
import { CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ServiceUpdatesListProps {
  updates: ServiceUpdate[];
  loading: boolean;
  isShopPortal?: boolean;
}

export const ServiceUpdatesList: React.FC<ServiceUpdatesListProps> = ({
  updates,
  loading,
  isShopPortal = false
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-muted-foreground">Loading service updates...</p>
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {isShopPortal
            ? 'No updates have been posted yet. Add the first update about this service.'
            : 'No updates have been posted yet about your service.'}
        </p>
      </div>
    );
  }

  // Group updates by date
  const groupedUpdates: { [date: string]: ServiceUpdate[] } = {};
  
  updates.forEach(update => {
    const date = new Date(update.timestamp || update.created_at).toLocaleDateString();
    if (!groupedUpdates[date]) {
      groupedUpdates[date] = [];
    }
    groupedUpdates[date].push(update);
  });

  return (
    <div className="space-y-6">
      {Object.entries(groupedUpdates).map(([date, dateUpdates]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
          
          <div className="space-y-4">
            {dateUpdates.map((update) => (
              <Card key={update.id}>
                <CardContent className="p-4">
                  {update.milestone && (
                    <div className="flex items-center mb-2">
                      {update.milestoneCompleted || update.milestone_completed ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <Clock className="h-4 w-4 text-blue-500 mr-2" />
                      )}
                      <span className={`text-sm font-medium ${
                        update.milestoneCompleted || update.milestone_completed ? 'text-green-700' : 'text-blue-700'
                      }`}>
                        {update.milestone}
                      </span>
                    </div>
                  )}
                  
                  <p className="text-sm whitespace-pre-line">{update.content}</p>
                  
                  {/* Only show images if they exist */}
                  {update.images && update.images.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {update.images.map((imageUrl, index) => (
                        <a 
                          key={index} 
                          href={imageUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block overflow-hidden rounded-md border"
                        >
                          <img 
                            src={imageUrl} 
                            alt={`Service update ${index + 1}`} 
                            className="h-24 w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-3 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(update.timestamp || update.created_at), { addSuffix: true })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
