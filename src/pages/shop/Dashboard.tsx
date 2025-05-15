
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { metrics, loading } = useDashboardData();

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
        {metrics && [
          { id: 'totalEstimates', name: 'Total Estimates', value: metrics.totalEstimates },
          { id: 'pendingApproval', name: 'Pending Approval', value: metrics.pendingApproval },
          { id: 'approved', name: 'Approved', value: metrics.approved },
          { id: 'rejected', name: 'Rejected', value: metrics.rejected }
        ].map((metric) => {
          const IconComponent = metricIcons[metric.id as keyof typeof metricIcons];
          return (
            <Card key={metric.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className={`text-xs ${changeType[metric.id as keyof typeof changeType] === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
                  {changeData[metric.id as keyof typeof changeData]} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Current Activity Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Estimates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics && metrics.recentEstimates.length > 0 ? (
                metrics.recentEstimates.map((estimate) => (
                  <div key={estimate.id} className="flex items-center justify-between border-b last:border-0 py-2">
                    <div>
                      <p className="font-medium">Estimate #{estimate.id.substring(0, 8)}</p>
                      <p className="text-sm text-gray-500">{estimate.vehicle}</p>
                    </div>
                    <div className="text-sm font-medium">
                      ${estimate.amount.toFixed(2)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No recent estimates available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Active Work Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics && metrics.activeWorkOrders.length > 0 ? (
                metrics.activeWorkOrders.map((workOrder) => (
                  <div key={workOrder.id} className="flex items-center justify-between border-b last:border-0 py-2">
                    <div>
                      <p className="font-medium">WO #{workOrder.id.substring(0, 8)}</p>
                      <p className="text-sm text-gray-500">{workOrder.vehicle} - {workOrder.title}</p>
                    </div>
                    <div className="text-sm font-medium text-yellow-600">
                      {workOrder.status === 'in_progress' ? 'In Progress' : workOrder.status}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No active work orders at the moment
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Inventory Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics && metrics.inventoryAlerts.map((alert, index) => (
                <div 
                  key={index} 
                  className={`p-4 ${
                    alert.type === 'low_stock' 
                      ? 'bg-red-50 border border-red-200 text-red-700' 
                      : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                  } rounded-md`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="font-medium">{alert.message}</p>
                  </div>
                  <p className="text-sm mt-1">
                    {alert.count} {alert.type === 'low_stock' 
                      ? 'items are below minimum stock level' 
                      : 'items need to be ordered'}
                  </p>
                </div>
              ))}
              {(!metrics || metrics.inventoryAlerts.length === 0) && (
                <div className="text-center py-4 text-gray-500">
                  No inventory alerts at this time
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
    </div>
  );
};

export default Dashboard;
