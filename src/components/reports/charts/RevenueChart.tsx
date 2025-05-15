
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useState } from 'react';
import { 
  Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  BarChart, LineChart, AreaChart
} from 'recharts';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { chartConfig } from '../config/chartConfig';

interface RevenueChartProps {
  data: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
  const [chartType, setChartType] = useState("bar");
  const [revenueView, setRevenueView] = useState("revenue");

  return (
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
              <BarChart data={data}>
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
              <LineChart data={data}>
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
              <AreaChart data={data}>
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
  );
};
