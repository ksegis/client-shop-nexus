import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Package, 
  TrendingDown,
  Plus,
  Search,
  Calendar,
  Receipt,
  Users,
  Wrench,
  ShoppingCart,
  Truck,
  DollarSign,
  TrendingUp,
  Eye,
  ExternalLink
} from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useInventoryData } from '@/hooks/useInventoryData';
import { useOrdersData } from '@/hooks/useOrdersData';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import AppointmentsOverview from '@/components/shop/dashboard/AppointmentsOverview';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Quick Actions Component with Orders
const QuickActionsSection = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'New Work Order',
      description: 'Create a new work order',
      icon: Plus,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => navigate('/shop/work-orders/new')
    },
    {
      title: 'Special Order',
      description: 'Place a special order',
      icon: ShoppingCart,
      color: 'bg-emerald-500 hover:bg-emerald-600',
      action: () => navigate('/shop/parts?tab=special-orders')
    },
    {
      title: 'Customer Lookup',
      description: 'Search customers',
      icon: Search,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => navigate('/shop/customers')
    },
    {
      title: 'Parts Search',
      description: 'Find parts & inventory',
      icon: Package,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => navigate('/shop/parts')
    },
    {
      title: 'Schedule Appointment',
      description: 'Book service appointment',
      icon: Calendar,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => navigate('/shop/service-appointments')
    },
    {
      title: 'Generate Invoice',
      description: 'Create new invoice',
      icon: Receipt,
      color: 'bg-red-500 hover:bg-red-600',
      action: () => navigate('/shop/invoices/new')
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <p className="text-sm text-muted-foreground">Common tasks and shortcuts</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <Card 
              key={index}
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 border-l-4 border-l-transparent hover:border-l-blue-500"
              onClick={action.action}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg text-white ${action.color} transition-colors duration-200`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{action.title}</h3>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// Today's Priority Tasks Component with Orders
const TodaysPriorities = () => {
  const { getOrdersRequiringAttention } = useOrdersData();
  const ordersRequiringAttention = getOrdersRequiringAttention();

  const priorities = [
    {
      title: 'Pending Orders',
      count: ordersRequiringAttention.length,
      icon: ShoppingCart,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      action: '/shop/orders?status=pending'
    },
    {
      title: 'Pending Approvals',
      count: 3,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      action: '/shop/estimates?status=pending'
    },
    {
      title: 'Scheduled Services',
      count: 7,
      icon: Wrench,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: '/shop/service-appointments'
    },
    {
      title: 'Low Stock Alerts',
      count: 12,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      action: '/shop/inventory?filter=low-stock'
    }
  ];

  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Today's Priorities</h2>
      
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {priorities.map((priority, index) => {
          const IconComponent = priority.icon;
          return (
            <Card 
              key={index}
              className="cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={() => navigate(priority.action)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${priority.bgColor}`}>
                      <IconComponent className={`h-4 w-4 ${priority.color}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{priority.title}</h3>
                      <p className="text-xs text-muted-foreground">Requires attention</p>
                    </div>
                  </div>
                  <div className={`text-xl font-bold ${priority.color}`}>
                    {priority.count}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// Recent Orders Component
const RecentOrdersSection = () => {
  const { recentOrders, loading } = useOrdersData();
  const [selectedOrderDialog, setSelectedOrderDialog] = useState<boolean>(false);
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'processing': return Package;
      case 'shipped': return Truck;
      case 'delivered': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  const handleOrderClick = (orderId: string) => {
    navigate(`/shop/orders/${orderId}`);
    setSelectedOrderDialog(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Orders</h2>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Orders</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSelectedOrderDialog(true)}
        >
          <Eye className="h-4 w-4 mr-2" />
          View All
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-6">
          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.slice(0, 5).map((order) => {
                const StatusIcon = getStatusIcon(order.status);
                return (
                  <div 
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleOrderClick(order.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-gray-100">
                        <StatusIcon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{order.orderReference}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.customerName} • {order.itemCount} items
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                        {order.status}
                      </Badge>
                      <div className="text-sm font-medium mt-1">
                        ${order.totalAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {recentOrders.length > 5 && (
                <div className="text-center pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedOrderDialog(true)}
                  >
                    View {recentOrders.length - 5} more orders
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <div className="text-sm">No recent orders</div>
              <div className="text-xs text-muted-foreground mt-1">
                Orders will appear here once placed
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Orders Dialog */}
      <Dialog open={selectedOrderDialog} onOpenChange={setSelectedOrderDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>All Recent Orders</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {recentOrders.map((order) => {
                const StatusIcon = getStatusIcon(order.status);
                return (
                  <div 
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleOrderClick(order.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-gray-100">
                        <StatusIcon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">{order.orderReference}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.customerName} ({order.customerEmail})
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.itemCount} items • {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                        {order.trackingNumber && (
                          <div className="text-xs text-blue-600">
                            Tracking: {order.trackingNumber}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                        {order.status}
                      </Badge>
                      <div className="font-medium mt-1">
                        ${order.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.shippingMethod}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Dashboard = () => {
  const { estimates, workOrders, inventory, customerCount, loading, error } = useDashboardData();
  const { inventoryItems } = useInventoryData();
  const { summary: ordersSummary, loading: ordersLoading } = useOrdersData();
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
    totalOrders: ShoppingCart,
    pendingOrders: Clock,
    shippedOrders: Truck,
    totalRevenue: DollarSign,
  };

  // Loading placeholders
  if (loading || ordersLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your shop's performance and key metrics.
          </p>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
  const changeData = {
    totalEstimates: '+12%',
    pendingApproval: '-5%',
    approved: '+18%',
    rejected: '+2%',
    totalOrders: '+25%',
    pendingOrders: '+8%',
    shippedOrders: '+15%',
    totalRevenue: '+32%',
  };

  const changeType = {
    totalEstimates: 'positive',
    pendingApproval: 'positive',
    approved: 'positive',
    rejected: 'negative',
    totalOrders: 'positive',
    pendingOrders: 'neutral',
    shippedOrders: 'positive',
    totalRevenue: 'positive',
  };

  // Process inventory items for cards
  const lowStockItems = inventoryItems.filter(item => 
    item.quantity > 0 && item.quantity <= (item.reorder_level || 10)
  );

  const criticalAlerts = inventoryItems.filter(item => 
    item.quantity === 0 || item.quantity < 5
  );

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

  const handleItemClick = (itemId: string) => {
    navigate(`/shop/inventory?item=${itemId}`);
    setSelectedInventoryCard(null);
  };

  const handleEstimateClick = (estimateId: string) => {
    navigate(`/shop/estimates?estimate=${estimateId}`);
    setSelectedEstimatesDialog(false);
  };

  const handleWorkOrderClick = (workOrderId: string) => {
    navigate(`/shop/work-orders/${workOrderId}`);
    setSelectedWorkOrdersDialog(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening in your shop today.
        </p>
      </div>

      {/* Quick Actions Section */}
      <QuickActionsSection />

      {/* Today's Priorities */}
      <TodaysPriorities />

      {/* Enhanced Metrics Cards with Orders */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Key Metrics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Estimates Metrics */}
          {[
            { id: 'totalEstimates', name: 'Total Estimates', value: estimates.count },
            { id: 'pendingApproval', name: 'Pending Approval', value: estimates.pending },
            { id: 'approved', name: 'Approved', value: estimates.approved },
            { id: 'customerCount', name: 'Customers', value: customerCount }
          ].map((metric) => {
            const IconComponent = metricIcons[metric.id as keyof typeof metricIcons] || FileText;
            return (
              <Card key={metric.id} className="hover:shadow-md transition-shadow">
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

        {/* Orders Metrics Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { id: 'totalOrders', name: 'Total Orders', value: ordersSummary.total },
            { id: 'pendingOrders', name: 'Pending Orders', value: ordersSummary.pending },
            { id: 'shippedOrders', name: 'Shipped Orders', value: ordersSummary.shipped },
            { id: 'totalRevenue', name: 'Orders Revenue', value: `$${ordersSummary.totalRevenue.toFixed(0)}` }
          ].map((metric) => {
            const IconComponent = metricIcons[metric.id as keyof typeof metricIcons] || ShoppingCart;
            return (
              <Card key={metric.id} className="hover:shadow-md transition-shadow border-emerald-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                  <IconComponent className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{metric.value}</div>
                  <p className={`text-xs ${
                    changeType[metric.id as keyof typeof changeType] === 'positive' ? 
                    'text-green-500' : changeType[metric.id as keyof typeof changeType] === 'negative' ?
                    'text-red-500' : 'text-gray-500'}`
                  }>
                    {changeData[metric.id as keyof typeof changeData] || "+0%"} from last month
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Orders Section */}
      <RecentOrdersSection />

      {/* Appointments Overview */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Service Appointments</h2>
        <AppointmentsOverview />
      </div>

      {/* Current Activity Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
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
      </div>

      {/* Inventory Overview */}
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
                    {card.id === 'total' ? 'Total inventory items' :
                     card.id === 'lowStock' ? 'Items need restocking' :
                     'Items out of stock'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Inventory Detail Dialog */}
      {selectedInventoryCard && selectedCardData && (
        <Dialog open={!!selectedInventoryCard} onOpenChange={() => setSelectedInventoryCard(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedCardData.title}</DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {selectedCardData.items.length > 0 ? (
                <div className="space-y-2">
                  {selectedCardData.items.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleItemClick(item.id)}
                    >
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${
                          item.quantity <= (item.reorder_level || 10) ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {item.quantity} units
                        </div>
                        <div className="text-sm text-muted-foreground">${item.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No items in this category
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Estimates Dialog */}
      <Dialog open={selectedEstimatesDialog} onOpenChange={setSelectedEstimatesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recent Estimates</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {estimates.recent.length > 0 ? (
              <div className="space-y-2">
                {estimates.recent.map((estimate) => (
                  <div 
                    key={estimate.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleEstimateClick(estimate.id)}
                  >
                    <div>
                      <div className="font-medium">Estimate #{estimate.id}</div>
                      <div className="text-sm text-muted-foreground">{estimate.customer}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant={estimate.status === 'approved' ? 'default' : 'secondary'}>
                        {estimate.status}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">${estimate.amount}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent estimates
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Work Orders Dialog */}
      <Dialog open={selectedWorkOrdersDialog} onOpenChange={setSelectedWorkOrdersDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Active Work Orders</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {workOrders.recent.length > 0 ? (
              <div className="space-y-2">
                {workOrders.recent.map((workOrder) => (
                  <div 
                    key={workOrder.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleWorkOrderClick(workOrder.id)}
                  >
                    <div>
                      <div className="font-medium">Work Order #{workOrder.id}</div>
                      <div className="text-sm text-muted-foreground">{workOrder.customer}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant={workOrder.status === 'completed' ? 'default' : 'secondary'}>
                        {workOrder.status}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">{workOrder.vehicle}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No active work orders
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;

