
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useServiceHistory, ServiceHistoryEntry } from '@/hooks/useServiceHistory';
import ServiceHistoryList from '@/components/service/ServiceHistoryList';
import { Vehicle } from '@/types/vehicle';
import { Button } from '@/components/ui/button';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface VehicleServiceHistoryProps {
  vehicle: Vehicle;
}

const VehicleServiceHistory = ({ vehicle }: VehicleServiceHistoryProps) => {
  const [expanded, setExpanded] = useState(false);
  const [serviceHistory, setServiceHistory] = useState<ServiceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { getVehicleServiceHistory } = useServiceHistory();
  
  useEffect(() => {
    if (expanded && serviceHistory.length === 0) {
      setLoading(true);
      getVehicleServiceHistory(vehicle.id)
        .then(history => {
          setServiceHistory(history as ServiceHistoryEntry[]);
          setLoading(false);
        });
    }
  }, [expanded, vehicle.id, serviceHistory.length, getVehicleServiceHistory]);
  
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Service History
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="pt-2 px-4 pb-4">
          {loading ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Loading service history...</p>
            </div>
          ) : (
            <ServiceHistoryList 
              serviceHistory={serviceHistory} 
              emptyMessage={`No service history found for this ${vehicle.year} ${vehicle.make} ${vehicle.model}.`}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default VehicleServiceHistory;
