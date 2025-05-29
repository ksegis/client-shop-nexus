
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, XCircle, Clock, AlertTriangle, Package, TrendingDown } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useInventoryData } from '@/hooks/useInventoryData';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import AppointmentsOverview from '@/components/shop/dashboard/AppointmentsOverview';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { estimates, workOrders, inventory, customerCount, loading, error } = useDashboardData();
  const { inventoryItems } = useInventoryData();
  const [selectedInventoryCard, setSelectedInventoryCard] = useState<string | null>(null);
  const [selectedEstimatesDialog, setSelectedEstimatesDialog] = useState<boolean>(false);
  const [selectedWorkOrdersDialog, setSelectedWorkOrdersDialog] = useState<boolean>(false);
  const navigate = useNavigate();

  // Metric card icons mapping
  const metricIcons = {
    totalEstimates: FileText,
    pendingApproval: Clock,
    approved: CheckCircle,
    rejected: XCircle,
  };

  // Loading placeholders
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your shop's performance and key metrics.
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <Skeleton className="h-4 w-28" />
                </CardTitle>
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-4 w-20 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Current Activity Section */}
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((card) => (
            <Card key={card} className="col-span-1">
              <CardHeader>
                <CardTitle><Skeleton className="h-5 w-36" /></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between border-b last:border-0 py-3">
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((card) => (
            <Card key={card} className="col-span-1">
              <CardHeader>
                <CardTitle><Skeleton className="h-5 w-36" /></CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md">
        <h2 className="text-xl font-bold text-red-700">Error Loading Dashboard</h2>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  // Calculate change percentages (these would be real calculations in a full implementation)
  // For demo, we'll use placeholder values
  const changeData = {
    totalEstimates: '+12%',
    pendingApproval: '-5%',
    approved: '+18%',
    rejected: '+2%',
  };

  // Determine if change is positive or negative
  const changeType = {
    totalEstimates: 'positive',
    pendingApproval: 'positive', // Counter-intuitive but fewer pending is good
    approved: 'positive',
    rejected: 'negative',
  };

  // Process inventory items for cards
  const lowStockItems = inventoryItems.filter(item => 
    item.quantity > 0 && item.quantity <= (item.reorder_level || 10)
  );

  const criticalAlerts = inventoryItems.filter(item => 
    item.quantity === 0 || item.quantity < 5
  );

  // Prepare inventory card data with detailed items
  const inventoryCards = [
    {
      id: 'total',
      title: 'Total Parts',
      count: inventoryItems.length,
      icon: Package,
      color: 'border-gray-200',
      items: inventoryItems
    },
    {
      id: 'lowStock',
      title: 'Low Stock Items',
      count: lowStockItems.length,
      icon: TrendingDown,
      color: lowStockItems.length > 0 ? 'border-orange-300' : 'border-gray-200',
      items: lowStockItems
    },
    {
      id: 'alerts',
      title: 'Critical Alerts',
      count: criticalAlerts.length,
      icon: AlertTriangle,
      color: criticalAlerts.length > 0 ? 'border-red-300' : 'border-gray-200',
      items: criticalAlerts
    }
  ];

  const selectedCardData = inventoryCards.find(card => card.id === selectedInventoryCard);

  // Handle clicking on an inventory item to navigate to inventory page
  const handleItemClick = (itemId: string) => {
    // Navigate to inventory page with the item ID as a query parameter
    navigate(`/shop/inventory?item=${itemId}`);
    setSelectedInventoryCard(null); // Close the dialog
  };

  // Handle clicking on an estimate to navigate to estimates page
  const handleEstimateClick = (estimateId: string) => {
    navigate(`/shop/estimates?estimate=${estimateId}`);
    setSelectedEstimatesDialog(false);
  };

  // Handle clicking on a work order to navigate to work orders page
  const handleWorkOrderClick = (workOrderId: string) => {
    navigate(`/shop/work-orders/${workOrderId}`);
    setSelectedWorkOrdersDialog(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your shop's performance and key metrics.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { id: 'totalEstimates', name: 'Total Estimates', value: estimates.count },
          { id: 'pendingApproval', name: 'Pending Approval', value: estimates.pending },
          { id: 'approved', name: 'Approved', value: estimates.approved },
          { id: 'customerCount', name: 'Customers', value: customerCount }
        ].map((metric) => {
          const IconComponent = metricIcons[metric.id as keyof typeof metricIcons] || FileText;
          return (
            <Card key={metric.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className={`text-xs ${
                  changeType[metric.id as keyof typeof changeType] === 'positive' ? 
                  'text-green-500' : 'text-red-500'}`
                }>
                  {changeData[metric.id as keyof typeof changeData] || "+0%"} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Appointments Overview */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Service Appointments</h2>
        <AppointmentsOverview />
      </div>

      {/* Current Activity Section - Now Interactive */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card 
          className="col-span-1 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setSelectedEstimatesDialog(true)}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Estimates
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {estimates.recent.length > 0 ? (
                <div>
                  <div className="text-2xl font-bold">{estimates.recent.length}</div>
                  <p className="text-xs text-muted-foreground">Click to view all estimates</p>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No recent estimates available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card 
          className="col-span-1 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setSelectedWorkOrdersDialog(true)}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Active Work Orders
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workOrders.recent.length > 0 ? (
                <div>
                  <div className="text-2xl font-bold">{workOrders.recent.length}</div>
                  <p className="text-xs text-muted-foreground">Click to view all work orders</p>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No active work orders at the moment
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Overview with Clickable Summary Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Inventory Overview</h2>
        
        <div className="grid gap-4 md:grid-cols-3">
          {inventoryCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Card 
                key={card.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${card.color}`}
                onClick={() => setSelectedInventoryCard(card.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    card.id === 'lowStock' && card.count > 0 ? "text-orange-600" :
                    card.id === 'alerts' && card.count > 0 ? "text-red-600" : ""
                  }`}>
                    {card.count}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {card.id === 'total' ? 'Items in inventory' :
                     card.id === 'lowStock' ? 'Need attention' :
                     'Require action'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Estimates Details Dialog */}
      <Dialog open={selectedEstimatesDialog} onOpenChange={setSelectedEstimatesDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Recent Estimates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {estimates.recent.length > 0 ? (
              estimates.recent.map((estimate) => (
                <Card 
                  key={estimate.id} 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleEstimateClick(estimate.id)}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Estimate #{estimate.id.substring(0, 8)}</h4>
                        <p className="text-sm text-gray-500">{estimate.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">${estimate.total_amount.toFixed(2)}</div>
                        <Badge variant="outline">Estimate</Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Created:</p>
                        <p className="text-gray-600">{new Date(estimate.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="font-medium">Title:</p>
                        <p className="text-gray-600">{estimate.title}</p>
                      </div>
                    </div>
                    
                    <div className="text-xs text-blue-600 hover:underline">
                      Click to view estimate details →
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent estimates found
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Work Orders Details Dialog */}
      <Dialog open={selectedWorkOrdersDialog} onOpenChange={setSelectedWorkOrdersDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Active Work Orders</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {workOrders.recent.length > 0 ? (
              workOrders.recent.map((workOrder) => (
                <Card 
                  key={workOrder.id} 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleWorkOrderClick(workOrder.id)}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">WO #{workOrder.id.substring(0, 8)}</h4>
                        <p className="text-sm text-gray-500">{workOrder.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={workOrder.status === 'in_progress' ? 'default' : 'outline'}>
                          {workOrder.status === 'in_progress' ? 'In Progress' : workOrder.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Created:</p>
                        <p className="text-gray-600">{new Date(workOrder.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="font-medium">Title:</p>
                        <p className="text-gray-600">{workOrder.title}</p>
                      </div>
                    </div>
                    
                    <div className="text-xs text-blue-600 hover:underline">
                      Click to view work order details →
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No active work orders found
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Inventory Details Dialog */}
      <Dialog open={!!selectedInventoryCard} onOpenChange={() => setSelectedInventoryCard(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCardData?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCardData?.items && selectedCardData.items.length > 0 ? (
              selectedCardData.items.map((item) => (
                <Card 
                  key={item.id} 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleItemClick(item.id)}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        {item.sku && (
                          <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {selectedCardData.id === 'alerts' ? (
                          <Badge variant="destructive">Critical</Badge>
                        ) : selectedCardData.id === 'lowStock' ? (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">Low Stock</Badge>
                        ) : (
                          <Badge variant="outline">In Stock</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Current Stock:</p>
                        <p className="text-gray-600">{item.quantity || 0}</p>
                      </div>
                      <div>
                        <p className="font-medium">Minimum Stock:</p>
                        <p className="text-gray-600">{item.reorder_level || 10}</p>
                      </div>
                    </div>
                    
                    {item.price && (
                      <div>
                        <p className="text-sm font-medium">Price:</p>
                        <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                      </div>
                    )}
                    
                    {item.supplier && (
                      <div>
                        <p className="text-sm font-medium">Supplier:</p>
                        <p className="text-sm text-gray-600">{item.supplier}</p>
                      </div>
                    )}
                    
                    <div className="text-xs text-blue-600 hover:underline">
                      Click to view in inventory →
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No items found in this category
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Employee Performance */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Employee Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-700">
            <p className="font-medium">Staff Performance Summary</p>
            <p className="text-sm mt-1">Employee performance data is now available in the Reports section</p>
          </div>
          <div className="mt-2 flex justify-center">
            <a href="/shop/reports" className="text-sm text-blue-600 hover:underline">
              View detailed performance reports →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
