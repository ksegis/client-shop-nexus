
import { AlertTriangle } from 'lucide-react';

interface EstimateStatusWarningProps {
  changesAllowed: boolean;
  status: string;
}

const EstimateStatusWarning = ({ changesAllowed, status }: EstimateStatusWarningProps) => {
  if (changesAllowed) return null;
  
  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md mb-6 flex items-center">
      <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
      <div>
        <p className="font-medium">You cannot modify this estimate</p>
        <p className="text-sm">
          {['approved', 'completed'].includes(status) 
            ? "This estimate has already been approved or completed." 
            : "Work has already begun on this estimate."}
          {" "}Contact the shop to make changes.
        </p>
      </div>
    </div>
  );
};

export default EstimateStatusWarning;
