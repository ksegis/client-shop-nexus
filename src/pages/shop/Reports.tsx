
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  BarChart, LineChart, AreaChart
} from 'recharts';
import { Button } from '@/components/ui/button';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CalendarDays } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "@/hooks/use-toast";

// Sample data with more detail
const revenueData = [
  { month: 'Jan', revenue: 4000, expenses: 2400, profit: 1600 },
  { month: 'Feb', revenue: 3000, expenses: 1398, profit: 1602 },
  { month: 'Mar', revenue: 2000, expenses: 1800, profit: 200 },
  { month: 'Apr', revenue: 2780, expenses: 1908, profit: 872 },
  { month: 'May', revenue: 1890, expenses: 1400, profit: 490 },
  { month: 'Jun', revenue: 2390, expenses: 1800, profit: 590 },
  { month: 'Jul', revenue: 3490, expenses: 2300, profit: 1190 },
  { month: 'Aug', revenue: 4200, expenses: 2100, profit: 2100 },
  { month: 'Sep', revenue: 3800, expenses: 1950, profit: 1850 },
  { month: 'Oct', revenue: 4100, expenses: 2300, profit: 1800 },
  { month: 'Nov', revenue: 3700, expenses: 2500, profit: 1200 },
  { month: 'Dec', revenue: 5200, expenses: 2800, profit: 2400 },
];

const servicesData = [
  { name: 'Oil Change', count: 145, revenue: 7250 },
  { name: 'Brake Service', count: 87, revenue: 13050 },
  { name: 'Tire Rotation', count: 116, revenue: 4640 },
  { name: 'Battery Replace', count: 49, revenue: 7350 },
  { name: 'Transmission', count: 28, revenue: 14000 },
  { name: 'AC Service', count: 62, revenue: 9300 },
  { name: 'Engine Tune-up', count: 43, revenue: 8600 },
  { name: 'Exhaust System', count: 21, revenue: 4200 }
];

const customerSatisfactionData = [
  { month: 'Jan', score: 4.2 },
  { month: 'Feb', score: 4.3 },
  { month: 'Mar', score: 4.1 },
  { month: 'Apr', score: 4.4 },
  { month: 'May', score: 4.6 },
  { month: 'Jun', score: 4.7 },
  { month: 'Jul', score: 4.8 },
  { month: 'Aug', score: 4.7 },
  { month: 'Sep', score: 4.9 },
  { month: 'Oct', score: 4.7 },
  { month: 'Nov', score: 4.8 },
  { month: 'Dec', score: 4.8 },
];

const technicianPerformanceData = [
  { name: 'John', efficiency: 92, quality: 88, customerRating: 4.7 },
  { name: 'Sarah', efficiency: 87, quality: 95, customerRating: 4.9 },
  { name: 'Mike', efficiency: 82, quality: 91, customerRating: 4.5 },
  { name: 'Lisa', efficiency: 94, quality: 89, customerRating: 4.6 },
  { name: 'David', efficiency: 88, quality: 92, customerRating: 4.8 }
];

// Chart configurations - fixed to match ChartConfig type
const chartConfig = {
  revenue: {
    label: "Revenue",
    theme: {
      light: "#4f46e5",
      dark: "#818cf8"
    }
  },
  expenses: {
    label: "Expenses",
    theme: {
      light: "#ef4444",
      dark: "#f87171"
    }
  },
  profit: {
    label: "Profit",
    theme: {
      light: "#22c55e",
      dark: "#4ade80"
    }
  },
  count: {
    label: "Job Count",
    theme: {
      light: "#8b5cf6",
      dark: "#a78bfa"
    }
  },
  service: {
    label: "Service",
    theme: {
      light: "#f97316", 
      dark: "#fb923c"
    }
  }
};

const Reports = () => {
  const [timeframe, setTimeframe] = useState("year");
  const [chartType, setChartType] = useState("bar");
  const [revenueView, setRevenueView] = useState("revenue");
  const [serviceMetric, setServiceMetric] = useState("count");
  const [year, setYear] = useState("2024");
  
  const filterData = () => {
    // For demonstration purposes - would connect to real data filtering
    toast({
      title: "Data filtered",
      description: `Showing data for ${year}, view: ${timeframe}`,
    });
  };

  // Dynamically filter data based on selected year (simulated)
  const filteredRevenueData = timeframe === "quarter" 
    ? revenueData.slice(0, 3) 
    : timeframe === "month" 
      ? revenueData.slice(0, 1) 
      : revenueData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            View performance metrics and analytics for your shop.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Select defaultValue={year} onValueChange={setYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
              </SelectContent>
            </Select>
          
            <Button 
              variant="outline" 
              className="flex items-center gap-1" 
              onClick={filterData}
            >
              <CalendarDays className="h-4 w-4" />
              <span>Filter</span>
            </Button>
          </div>
          
          <ToggleGroup 
            type="single" 
            value={timeframe} 
            onValueChange={(value) => value && setTimeframe(value)}
          >
            <ToggleGroupItem value="month" aria-label="Toggle month view">
              Month
            </ToggleGroupItem>
            <ToggleGroupItem value="quarter" aria-label="Toggle quarter view">
              Quarter
            </ToggleGroupItem>
            <ToggleGroupItem value="year" aria-label="Toggle year view">
              Year
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Report */}
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Revenue Overview</CardTitle>
            <div className="flex items-center space-x-2">
              <ToggleGroup 
                type="single" 
                value={chartType} 
                onValueChange={(value) => value && setChartType(value)}
                size="sm"
              >
                <ToggleGroupItem value="bar" aria-label="Bar chart">
                  Bar
                </ToggleGroupItem>
                <ToggleGroupItem value="line" aria-label="Line chart">
                  Line
                </ToggleGroupItem>
                <ToggleGroupItem value="area" aria-label="Area chart">
                  Area
                </ToggleGroupItem>
              </ToggleGroup>
              
              <ToggleGroup 
                type="single" 
                value={revenueView} 
                onValueChange={(value) => value && setRevenueView(value)}
                size="sm"
              >
                <ToggleGroupItem value="revenue" aria-label="Show revenue">
                  Revenue
                </ToggleGroupItem>
                <ToggleGroupItem value="expenses" aria-label="Show expenses">
                  Expenses
                </ToggleGroupItem>
                <ToggleGroupItem value="profit" aria-label="Show profit">
                  Profit
                </ToggleGroupItem>
                <ToggleGroupItem value="all" aria-label="Show all">
                  All
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer 
              config={chartConfig} 
              className="aspect-[4/2] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={filteredRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                    />
                    <Legend />
                    {(revenueView === 'revenue' || revenueView === 'all') && (
                      <Bar dataKey="revenue" name="Revenue" />
                    )}
                    {(revenueView === 'expenses' || revenueView === 'all') && (
                      <Bar dataKey="expenses" name="Expenses" />
                    )}
                    {(revenueView === 'profit' || revenueView === 'all') && (
                      <Bar dataKey="profit" name="Profit" />
                    )}
                  </BarChart>
                ) : chartType === 'line' ? (
                  <LineChart data={filteredRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                    />
                    <Legend />
                    {(revenueView === 'revenue' || revenueView === 'all') && (
                      <Line type="monotone" dataKey="revenue" activeDot={{ r: 8 }} name="Revenue" />
                    )}
                    {(revenueView === 'expenses' || revenueView === 'all') && (
                      <Line type="monotone" dataKey="expenses" activeDot={{ r: 8 }} name="Expenses" />
                    )}
                    {(revenueView === 'profit' || revenueView === 'all') && (
                      <Line type="monotone" dataKey="profit" activeDot={{ r: 8 }} name="Profit" />
                    )}
                  </LineChart>
                ) : (
                  <AreaChart data={filteredRevenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-profit)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--color-profit)" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                    />
                    <Legend />
                    {(revenueView === 'revenue' || revenueView === 'all') && (
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="var(--color-revenue)" 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)"
                        name="Revenue"
                      />
                    )}
                    {(revenueView === 'expenses' || revenueView === 'all') && (
                      <Area 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="var(--color-expenses)" 
                        fillOpacity={1} 
                        fill="url(#colorExpenses)"
                        name="Expenses"
                      />
                    )}
                    {(revenueView === 'profit' || revenueView === 'all') && (
                      <Area 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="var(--color-profit)" 
                        fillOpacity={1} 
                        fill="url(#colorProfit)"
                        name="Profit"
                      />
                    )}
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        
        {/* Services Report */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Popular Services</CardTitle>
            <ToggleGroup 
              type="single" 
              value={serviceMetric} 
              onValueChange={(value) => value && setServiceMetric(value)}
              size="sm"
            >
              <ToggleGroupItem value="count" aria-label="Sort by count">
                Count
              </ToggleGroupItem>
              <ToggleGroupItem value="revenue" aria-label="Sort by revenue">
                Revenue
              </ToggleGroupItem>
            </ToggleGroup>
          </CardHeader>
          <CardContent>
            <ChartContainer 
              config={chartConfig} 
              className="aspect-[4/3] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={
                    // Sort based on selected metric
                    [...servicesData].sort((a, b) => 
                      serviceMetric === "count" 
                        ? b.count - a.count 
                        : b.revenue - a.revenue
                    )
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                  />
                  <Bar 
                    dataKey={serviceMetric} 
                    name={serviceMetric === "count" ? "Jobs" : "Revenue"}
                    label={{ position: 'top', fill: '#666', fontSize: 12 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        
        {/* Customer Satisfaction */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer 
              config={chartConfig} 
              className="aspect-[4/3] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={customerSatisfactionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 5]} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#f97316" 
                    activeDot={{ r: 8 }}
                    name="Rating (0-5)" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Technician Performance */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Technician Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer 
              config={chartConfig} 
              className="aspect-[4/2] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={technicianPerformanceData}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 5]}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="efficiency" name="Efficiency %" fill="#3b82f6" />
                  <Bar yAxisId="left" dataKey="quality" name="Quality %" fill="#14b8a6" />
                  <Bar yAxisId="right" dataKey="customerRating" name="Rating (0-5)" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
