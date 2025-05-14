
import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

// Updated to match the database structure
interface Estimate {
  id: string;
  created_at: string;
  vehicle_id: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'declined' | 'completed';
  title: string;
  vehicles?: {
    make: string;
    model: string;
    year: number;
  };
}

const EstimatesPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch estimates from Supabase when component mounts
  useEffect(() => {
    const fetchEstimates = async () => {
      if (!user) return;
      
      // If using mock user, return mock data
      if (user.id === 'mock-user-id') {
        setEstimates([
          {
            id: 'mock-estimate-1',
            title: 'Routine Maintenance',
            created_at: new Date().toISOString(),
            vehicle_id: 'mock-vehicle-1',
            total_amount: 150.00,
            status: 'pending',
            vehicles: {
              make: 'Toyota',
              model: 'Camry',
              year: 2020
            }
          },
          {
            id: 'mock-estimate-2',
            title: 'Diagnostic Service',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            vehicle_id: 'mock-vehicle-2',
            total_amount: 75.00,
            status: 'approved',
            vehicles: {
              make: 'Honda',
              model: 'Civic',
              year: 2019
            }
          }
        ]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('estimates')
          .select(`
            *,
            vehicles (
              make,
              model,
              year
            )
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setEstimates(data || []);
      } catch (error: any) {
        console.error('Error fetching estimates:', error);
        toast({
          title: "Error",
          description: `Failed to load estimates: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEstimates();
  }, [user, toast]);

  const handleApproveAll = async () => {
    if (!user) return;
    
    try {
      // Get all pending estimates
      const pendingEstimates = estimates.filter(est => est.status === 'pending');
      
      if (pendingEstimates.length === 0) {
        toast({
          title: "No pending estimates",
          description: "There are no pending estimates to approve.",
        });
        return;
      }
      
      // Update all pending estimates to approved
      const { error } = await supabase
        .from('estimates')
        .update({ status: 'approved' })
        .in('id', pendingEstimates.map(est => est.id))
        .eq('customer_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setEstimates(prevEstimates => 
        prevEstimates.map(est => 
          est.status === 'pending' ? { ...est, status: 'approved' } : est
        )
      );
      
      toast({
        title: "Estimates Approved",
        description: `${pendingEstimates.length} pending estimates have been approved.`,
      });
      
    } catch (error: any) {
      console.error('Error approving estimates:', error);
      toast({
        title: "Error",
        description: `Failed to approve estimates: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'declined':
        return 'text-red-600 bg-red-50';
      case 'completed':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Format the date properly
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  // Format vehicle display
  const formatVehicle = (estimate: Estimate) => {
    return estimate.vehicles 
      ? `${estimate.vehicles.year} ${estimate.vehicles.make} ${estimate.vehicles.model}`
      : 'Unknown vehicle';
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
            disabled={!estimates.some(est => est.status === 'pending')}
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Loading estimates...
                    </TableCell>
                  </TableRow>
                ) : estimates.length > 0 ? (
                  estimates.map((estimate) => (
                    <TableRow key={estimate.id}>
                      <TableCell className="font-medium">{estimate.id.substring(0, 8)}...</TableCell>
                      <TableCell>{formatDate(estimate.created_at)}</TableCell>
                      <TableCell>{formatVehicle(estimate)}</TableCell>
                      <TableCell className="text-right">
                        ${estimate.total_amount.toFixed(2)}
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
                  ))
                ) : (
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
      </div>
    </Layout>
  );
};

export default EstimatesPage;
