
import React from 'react';
import { useTransactionHistory, Transaction, TransactionStatus } from './TransactionHistoryContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, isValid } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import EmptyState from './components/EmptyState';

const safeFormatDate = (dateString: string) => {
  const date = new Date(dateString);
  return isValid(date) ? format(date, 'MMM dd, yyyy') : 'Invalid date';
};

const StatusBadge = ({ status }: { status: TransactionStatus }) => {
  let bgColor = '';
  switch (status) {
    case 'completed':
      bgColor = 'bg-green-100 text-green-800';
      break;
    case 'pending':
      bgColor = 'bg-yellow-100 text-yellow-800';
      break;
    case 'failed':
      bgColor = 'bg-red-100 text-red-800';
      break;
    default:
      bgColor = 'bg-gray-100 text-gray-800';
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const TransactionHistoryTable = () => {
  const { transactions, isLoading } = useTransactionHistory();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-shop-primary" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{safeFormatDate(transaction.created_at)}</TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell>{formatCurrency(transaction.amount)}</TableCell>
              <TableCell>{transaction.payment_method}</TableCell>
              <TableCell>
                <StatusBadge status={transaction.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionHistoryTable;
