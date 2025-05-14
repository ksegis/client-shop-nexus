
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FileText, ChevronRight, Search, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCustomerEstimates } from '@/hooks/customer/useCustomerEstimates';

const CustomerEstimates = () => {
  const { estimates, loading } = useCustomerEstimates();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter estimates based on search query
  const filteredEstimates = estimates.filter(estimate => 
    estimate.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (estimate.vehicles && `${estimate.vehicles.year} ${estimate.vehicles.make} ${estimate.vehicles.model}`.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Estimates</h1>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search estimates..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Alert for pending estimates */}
      {estimates.some(est => est.status === 'pending') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-900">Pending Estimates</h3>
            <p className="text-yellow-700 text-sm">
              You have {estimates.filter(est => est.status === 'pending').length} estimate(s) that require your review and approval.
            </p>
          </div>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Service Estimates</CardTitle>
          <CardDescription>View and manage your service estimates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading estimates...</p>
              </div>
            ) : filteredEstimates.length > 0 ? (
              filteredEstimates.map((estimate) => {
                const vehicleName = estimate.vehicles 
                  ? `${estimate.vehicles.year} ${estimate.vehicles.make} ${estimate.vehicles.model}` 
                  : 'Unknown Vehicle';
                  
                return (
                  <div 
                    key={estimate.id} 
                    className="p-4 border rounded-lg flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1 hidden sm:block">
                        <FileText className="h-8 w-8 text-blue-500" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-medium">{estimate.title}</h3>
                        <p className="text-sm text-gray-500">{vehicleName}</p>
                        <p className="text-xs text-gray-400">Created: {new Date(estimate.created_at).toLocaleDateString()}</p>
                        <div className="md:hidden flex items-center justify-between mt-2">
                          <Badge className={getStatusColor(estimate.status)}>
                            {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                          </Badge>
                          <span className="font-bold">${estimate.total_amount?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-6">
                      <Badge className={getStatusColor(estimate.status)}>
                        {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                      </Badge>
                      <span className="font-bold w-24 text-right">${estimate.total_amount?.toFixed(2) || '0.00'}</span>
                      <Button variant="ghost" size="sm" asChild className="ml-2">
                        <Link to={`/customer/estimates/${estimate.id}`}>
                          <span className="sr-only">View estimate</span>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                    
                    <div className="md:hidden mt-4">
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <Link to={`/customer/estimates/${estimate.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium">No Estimates Yet</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  You don't have any service estimates yet.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerEstimates;
