
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, Users, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

const ShopDashboard = () => {
  // Mock data for demonstration
  const metrics = [
    { id: 1, name: 'Total Estimates', value: 128, icon: FileText, change: '+12%', changeType: 'positive' },
    { id: 2, name: 'Pending Approval', value: 24, icon: Clock, change: '-5%', changeType: 'positive' },
    { id: 3, name: 'Approved', value: 87, icon: CheckCircle, change: '+18%', changeType: 'positive' },
    { id: 4, name: 'Rejected', value: 17, icon: XCircle, change: '+2%', changeType: 'negative' },
  ];

  return (
    <Layout portalType="shop">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your shop's performance and key metrics.
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className={`text-xs ${metric.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
                  {metric.change} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Current Activity Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Recent Estimates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Placeholder content */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b last:border-0 py-2">
                    <div>
                      <p className="font-medium">Estimate #{1000 + i}</p>
                      <p className="text-sm text-gray-500">Honda Civic - Oil Change + Brake Inspection</p>
                    </div>
                    <div className="text-sm font-medium">
                      ${(150 + i * 25).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              {/* Integration placeholder comment */}
              {/* <!-- TODO: fetch recent estimates via GHL webhook → Zapier → Supabase --> */}
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Active Work Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Placeholder content */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b last:border-0 py-2">
                    <div>
                      <p className="font-medium">WO #{2000 + i}</p>
                      <p className="text-sm text-gray-500">Toyota Corolla - Transmission Service</p>
                    </div>
                    <div className="text-sm font-medium text-yellow-600">
                      In Progress
                    </div>
                  </div>
                ))}
              </div>
              {/* Integration placeholder comment */}
              {/* <!-- TODO: fetch active work orders via GHL webhook → Zapier → Supabase --> */}
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
                {/* Placeholder content */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                  <p className="font-medium">Low Stock Alert</p>
                  <p className="text-sm">5 items are below minimum stock level</p>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
                  <p className="font-medium">Order Reminder</p>
                  <p className="text-sm">3 pending orders require approval</p>
                </div>
              </div>
              {/* Integration placeholder comment */}
              {/* <!-- TODO: fetch inventory alerts via GHL webhook → Zapier → Supabase --> */}
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Employee Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Placeholder content - would be a chart in real implementation */}
                <div className="h-[160px] flex items-center justify-center bg-gray-100 rounded-md">
                  <div className="text-center">
                    <BarChart2 className="h-8 w-8 mx-auto text-shop-primary opacity-70" />
                    <p className="mt-2 text-sm text-gray-500">Performance chart will appear here</p>
                  </div>
                </div>
              </div>
              {/* Integration placeholder comment */}
              {/* <!-- TODO: fetch employee performance data via GHL webhook → Zapier → Supabase --> */}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ShopDashboard;
