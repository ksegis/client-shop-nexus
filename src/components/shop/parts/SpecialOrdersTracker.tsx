
import { useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSpecialOrder, SpecialOrderStatus } from '@/hooks/parts/useSpecialOrder';
import { formatDistanceToNow } from 'date-fns';

export function SpecialOrdersTracker() {
  const { specialOrders, fetchSpecialOrders, updateSpecialOrderStatus, isLoading } = useSpecialOrder();
  
  useEffect(() => {
    fetchSpecialOrders();
  }, []);
  
  const getStatusColor = (status: SpecialOrderStatus) => {
    switch(status) {
      case 'requested': return 'bg-blue-100 text-blue-800';
      case 'sourcing': return 'bg-yellow-100 text-yellow-800';
      case 'quoted': return 'bg-purple-100 text-purple-800';
      case 'ordered': return 'bg-indigo-100 text-indigo-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (orderId: string, newStatus: SpecialOrderStatus) => {
    updateSpecialOrderStatus(orderId, newStatus);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading special orders...</div>;
  }

  if (specialOrders.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md bg-muted/20">
        <p className="text-muted-foreground">No special orders found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Requested</TableHead>
            <TableHead>Part Name</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>ETA</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {specialOrders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">
                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{order.part_name}</div>
                  <div className="text-xs text-muted-foreground">{order.manufacturer}</div>
                </div>
              </TableCell>
              <TableCell>{order.quantity}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(order.status as SpecialOrderStatus)}>
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell>
                {order.quoted_price ? (
                  <span className="font-medium">${order.quoted_price.toFixed(2)}</span>
                ) : (
                  <span className="text-muted-foreground text-sm">Pending</span>
                )}
              </TableCell>
              <TableCell>
                {order.estimated_arrival ? (
                  <span>{formatDistanceToNow(new Date(order.estimated_arrival), { addSuffix: true })}</span>
                ) : (
                  <span className="text-muted-foreground text-sm">TBD</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {order.status === 'sourcing' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStatusChange(order.id, 'quoted')}
                  >
                    Mark Quoted
                  </Button>
                )}
                {order.status === 'quoted' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStatusChange(order.id, 'ordered')}
                  >
                    Place Order
                  </Button>
                )}
                {order.status === 'ordered' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStatusChange(order.id, 'received')}
                  >
                    Mark Received
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
