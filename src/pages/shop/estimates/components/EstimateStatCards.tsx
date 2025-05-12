
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, ThumbsUp, XCircle } from 'lucide-react';
import { EstimateStats } from '../types';

interface EstimateStatCardsProps {
  stats: EstimateStats;
}

export default function EstimateStatCards({ stats }: EstimateStatCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Pending Estimates Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <div className="flex items-baseline">
                <h3 className="text-2xl font-bold">{stats.pending.count}</h3>
                <p className="ml-2 text-sm text-muted-foreground">estimates</p>
              </div>
              <p className="text-sm font-medium mt-1">{formatCurrency(stats.pending.value)}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
        </CardContent>
      </Card>

      {/* Approved Estimates Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Approved</p>
              <div className="flex items-baseline">
                <h3 className="text-2xl font-bold">{stats.approved.count}</h3>
                <p className="ml-2 text-sm text-muted-foreground">estimates</p>
              </div>
              <p className="text-sm font-medium mt-1">{formatCurrency(stats.approved.value)}</p>
            </div>
            <ThumbsUp className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      {/* Declined Estimates Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Declined</p>
              <div className="flex items-baseline">
                <h3 className="text-2xl font-bold">{stats.declined.count}</h3>
                <p className="ml-2 text-sm text-muted-foreground">estimates</p>
              </div>
              <p className="text-sm font-medium mt-1">{formatCurrency(stats.declined.value)}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </CardContent>
      </Card>

      {/* Completed Estimates Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <div className="flex items-baseline">
                <h3 className="text-2xl font-bold">{stats.completed.count}</h3>
                <p className="ml-2 text-sm text-muted-foreground">estimates</p>
              </div>
              <p className="text-sm font-medium mt-1">{formatCurrency(stats.completed.value)}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
