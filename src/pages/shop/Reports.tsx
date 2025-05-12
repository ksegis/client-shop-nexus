
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, LineChart, AreaChart, ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data for demonstration
const revenueData = [
  { month: 'Jan', revenue: 4000, expenses: 2400 },
  { month: 'Feb', revenue: 3000, expenses: 1398 },
  { month: 'Mar', revenue: 2000, expenses: 9800 },
  { month: 'Apr', revenue: 2780, expenses: 3908 },
  { month: 'May', revenue: 1890, expenses: 4800 },
  { month: 'Jun', revenue: 2390, expenses: 3800 },
  { month: 'Jul', revenue: 3490, expenses: 4300 },
];

const servicesData = [
  { name: 'Oil Change', count: 145 },
  { name: 'Brake Service', count: 87 },
  { name: 'Tire Rotation', count: 116 },
  { name: 'Battery Replace', count: 49 },
  { name: 'Transmission', count: 28 },
  { name: 'AC Service', count: 62 },
];

const Reports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          View performance metrics and analytics for your shop.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Report */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#4f46e5" name="Revenue" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Services Report */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Services</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={servicesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#22c55e" name="Jobs" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Customer Satisfaction */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[
                { month: 'Jan', score: 4.2 },
                { month: 'Feb', score: 4.3 },
                { month: 'Mar', score: 4.1 },
                { month: 'Apr', score: 4.4 },
                { month: 'May', score: 4.6 },
                { month: 'Jun', score: 4.7 },
                { month: 'Jul', score: 4.8 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#f97316" name="Rating (0-5)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function ReportsPage() {
  return (
    <Layout portalType="shop">
      <Reports />
    </Layout>
  );
}
