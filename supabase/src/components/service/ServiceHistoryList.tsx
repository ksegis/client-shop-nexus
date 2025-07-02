
import { ServiceHistoryEntry } from '@/hooks/useServiceHistory';
import ServiceHistoryCard from './ServiceHistoryCard';

interface ServiceHistoryListProps {
  serviceHistory: ServiceHistoryEntry[];
  emptyMessage?: string;
}

const ServiceHistoryList = ({ 
  serviceHistory,
  emptyMessage = "No service history found."
}: ServiceHistoryListProps) => {
  if (!serviceHistory || serviceHistory.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {serviceHistory.map((entry) => (
        <ServiceHistoryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
};

export default ServiceHistoryList;
