
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

interface Estimate {
  id: string;
  date: string;
  vehicle: string;
  total: number;
  status: 'pending' | 'approved' | 'rejected';
}

const EstimatesPage = () => {
  const { toast } = useToast();
  const [estimates, setEstimates] = useState<Estimate[]>([
    { 
      id: 'EST-1001', 
      date: '2025-05-08', 
      vehicle: '2019 Toyota Camry', 
      total: 349.99, 
      status: 'pending' 
    },
    { 
      id: 'EST-1002', 
      date: '2025-05-05', 
      vehicle: '2020 Honda Accord', 
      total: 825.50, 
      status: 'approved' 
    },
    { 
      id: 'EST-1003', 
      date: '2025-04-28', 
      vehicle: '2019 Toyota Camry', 
      total: 129.99, 
      status: 'pending' 
    },
  ]);

  const handleApproveAll = () => {
    const updatedEstimates = estimates.map(est => ({
      ...est,
      status: 'approved' as const
    }));
    
    setEstimates(updatedEstimates);
    
    toast({
      title: "Estimates Approved",
      description: "All pending estimates have been approved.",
    });
    
    // Integration placeholder
    console.log('<!-- TODO: POST approval status via GHL webhook → Zapier → Supabase -->');
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Layout portalType="customer">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Estimates</h1>
            <p className="text-muted-foreground">
              Review and approve service estimates for your vehicles.
            </p>
          </div>
          
          <Button 
            onClick={handleApproveAll}
            className="bg-shop-primary hover:bg-shop-primary/90"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve All Pending
          </Button>
        </div>
        
        <Card>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estimate #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {estimates.map((estimate) => (
                  <TableRow key={estimate.id}>
                    <TableCell className="font-medium">{estimate.id}</TableCell>
                    <TableCell>{estimate.date}</TableCell>
                    <TableCell>{estimate.vehicle}</TableCell>
                    <TableCell className="text-right">
                      ${estimate.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(estimate.status)}`}>
                        {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/customer/estimates/${estimate.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                
                {estimates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      No estimates found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
        
        {/* Integration placeholder comments */}
        {/* <!-- TODO: fetch estimates via GHL webhook → Zapier → Supabase --> */}
        {/* <!-- TODO: POST approval status via GHL webhook --> */}
      </div>
    </Layout>
  );
};

export default EstimatesPage;
