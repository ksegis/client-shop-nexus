
import { useTransactionHistory } from './TransactionHistoryContext';
import EmptyState from './components/EmptyState';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const TransactionHistoryTable = () => {
  const { transactions, loading } = useTransactionHistory();

  if (loading) {
    return (
      <div className="py-10">
        <div className="flex justify-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-80"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
            <div className="h-4 bg-gray-200 rounded w-72"></div>
          </div>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Method
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.invoice_title || 'Invoice'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${transaction.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.payment_method}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <StatusBadge status={transaction.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Helper component for status badges
const StatusBadge = ({ status }: { status: string }) => {
  let variant: "outline" | "secondary" | "destructive" | "default" = "default";
  
  switch(status.toLowerCase()) {
    case 'completed':
      variant = "default"; // Green
      break;
    case 'pending':
      variant = "secondary"; // Yellow/Orange
      break;
    case 'failed':
      variant = "destructive"; // Red
      break;
    default:
      variant = "outline";
  }
  
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
};

export default TransactionHistoryTable;
