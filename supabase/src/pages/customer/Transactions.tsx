
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Receipt, ArrowUpDown, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CustomerTransactions = () => {
  const { toast } = useToast();
  
  // Mock transactions data
  const transactions = [
    {
      id: 'txn-001',
      date: '2023-05-20',
      description: 'Payment for Invoice #INV-001 - Brake Service',
      amount: 450.00,
      type: 'payment',
      method: 'credit_card',
      status: 'completed'
    },
    {
      id: 'txn-002',
      date: '2023-04-22',
      description: 'Payment for Invoice #INV-002 - Oil Change + Tire Rotation',
      amount: 120.00,
      type: 'payment',
      method: 'credit_card',
      status: 'completed'
    },
    {
      id: 'txn-003',
      date: '2023-04-05',
      description: 'Refund for returned parts',
      amount: 75.50,
      type: 'refund',
      method: 'credit_card',
      status: 'completed'
    },
    {
      id: 'txn-004',
      date: '2023-03-30',
      description: 'Payment for Invoice #INV-003 - Transmission Service',
      amount: 850.00,
      type: 'payment',
      method: 'bank_transfer',
      status: 'completed'
    }
  ];
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment':
        return 'bg-red-100 text-red-800';
      case 'refund':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'credit_card':
        return 'Credit Card';
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return method.replace('_', ' ').charAt(0).toUpperCase() + method.replace('_', ' ').slice(1);
    }
  };
  
  const handleDownloadStatement = () => {
    toast({
      title: "Statement Download",
      description: "Your transaction statement is being downloaded.",
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
        
        <Button variant="outline" onClick={handleDownloadStatement}>
          <Download className="mr-2 h-4 w-4" />
          Download Statement
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Transaction Records</CardTitle>
          <CardDescription>View your payment and refund history</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 pb-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="date-from">Date From</Label>
              <Input type="date" id="date-from" />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="date-to">Date To</Label>
              <Input type="date" id="date-to" />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="transaction-type">Type</Label>
              <Select>
                <SelectTrigger id="transaction-type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="mt-auto">Filter</Button>
          </div>
          
          <div className="relative overflow-x-auto rounded-lg border">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">
                    <div className="flex items-center">
                      Date
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <Receipt className="h-5 w-5 text-gray-400 mt-0.5" />
                        <span>{transaction.description}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getMethodLabel(transaction.method)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getTypeColor(transaction.type)}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {transaction.type === 'payment' ? '-' : '+'}
                      ${transaction.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <p className="text-sm text-gray-500">Showing {transactions.length} transactions</p>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerTransactions;
