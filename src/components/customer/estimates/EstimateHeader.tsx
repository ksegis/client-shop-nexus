
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, FileText, XCircle } from 'lucide-react';

interface EstimateHeaderProps {
  id: string;
  loading: boolean;
  changesAllowed: boolean;
  status: string;
  relatedInvoice: any;
  onReject: () => void;
  onApprove: () => void;
}

const EstimateHeader = ({
  id,
  loading,
  changesAllowed,
  status,
  relatedInvoice,
  onReject,
  onApprove
}: EstimateHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Link to="/customer/estimates">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Estimate {loading ? '' : `#${id.substring(0, 8)}...`}</h1>
      </div>
      
      <div className="flex space-x-2">
        {/* Show invoice link if available */}
        {relatedInvoice && (
          <Link to={`/customer/invoices/${relatedInvoice.id}`}>
            <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
              <FileText className="mr-2 h-4 w-4" />
              View Invoice
            </Button>
          </Link>
        )}
      
        <Button
          variant="outline"
          className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          onClick={onReject}
          disabled={!changesAllowed || status !== 'pending' || loading}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Reject
        </Button>
        
        <Button
          className="bg-shop-primary hover:bg-shop-primary/90"
          onClick={onApprove}
          disabled={!changesAllowed || status !== 'pending' || loading}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Approve All
        </Button>
      </div>
    </div>
  );
};

export default EstimateHeader;
