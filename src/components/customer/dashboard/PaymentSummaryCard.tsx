
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { InvoiceSummary } from '@/hooks/customer/useCustomerDashboard';

interface PaymentSummaryCardProps {
  outstandingInvoice: InvoiceSummary | null;
  loading: boolean;
}

export const PaymentSummaryCard = ({ outstandingInvoice, loading }: PaymentSummaryCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Summary</CardTitle>
        <CardDescription>Overview of your recent payments</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : outstandingInvoice ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Outstanding</h3>
                <p className="text-sm text-gray-500">Due: {outstandingInvoice.due_date || 'ASAP'}</p>
              </div>
              <span className="text-xl font-bold">${outstandingInvoice.amount_due.toFixed(2)}</span>
            </div>
            
            <Button asChild className="w-full">
              <Link to={`/customer/invoices/${outstandingInvoice.id}`}>View Invoice</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">No Outstanding Payments</h3>
                <p className="text-sm text-gray-500">Your account is up to date</p>
              </div>
            </div>
            
            <Button asChild variant="outline" className="w-full">
              <Link to="/customer/invoices">View All Invoices</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
