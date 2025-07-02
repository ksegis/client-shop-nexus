
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
    <Card className="col-span-2 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
        <CardTitle className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Revenue Overview
        </CardTitle>
        <div className="flex items-center space-x-3">
          <ToggleGroup 
            type="single" 
            value={chartType} 
            onValueChange={(value) => value && setChartType(value)}
            size="sm"
            className="bg-gray-100 rounded-lg p-1"
          >
            <ToggleGroupItem value="bar" className="data-[state=on]:bg-white data-[state=on]:shadow-sm">
              Bar
            </ToggleGroupItem>
            <ToggleGroupItem value="line" className="data-[state=on]:bg-white data-[state=on]:shadow-sm">
              Line
            </ToggleGroupItem>
            <ToggleGroupItem value="area" className="data-[state=on]:bg-white data-[state=on]:shadow-sm">
              Area
            </ToggleGroupItem>
          </ToggleGroup>
          
          <ToggleGroup 
            type="single" 
            value={revenueView} 
            onValueChange={(value) => value && setRevenueView(value)}
            size="sm"
            className="bg-gray-100 rounded-lg p-1"
          >
            <ToggleGroupItem value="revenue" className="data-[state=on]:bg-white data-[state=on]:shadow-sm">
              Revenue
            </ToggleGroupItem>
            <ToggleGroupItem value="expenses" className="data-[state=on]:bg-white data-[state=on]:shadow-sm">
              Expenses
            </ToggleGroupItem>
            <ToggleGroupItem value="profit" className="data-[state=on]:bg-white data-[state=on]:shadow-sm">
              Profit
            </ToggleGroupItem>
            <ToggleGroupItem value="all" className="data-[state=on]:bg-white data-[state=on]:shadow-sm">
              All
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer 
          config={chartConfig} 
          className="aspect-[4/2] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                />
                <Legend />
                {(revenueView === 'revenue' || revenueView === 'all') && (
                  <Bar 
                    dataKey="revenue" 
                    name="Revenue" 
                    fill="url(#revenueGrad)"
                    radius={[4, 4, 0, 0]}
                  />
                )}
                {(revenueView === 'expenses' || revenueView === 'all') && (
                  <Bar 
                    dataKey="expenses" 
                    name="Expenses" 
                    fill="url(#expensesGrad)"
                    radius={[4, 4, 0, 0]}
                  />
                )}
                {(revenueView === 'profit' || revenueView === 'all') && (
                  <Bar 
                    dataKey="profit" 
                    name="Profit" 
                    fill="url(#profitGrad)"
                    radius={[4, 4, 0, 0]}
                  />
                )}
              </BarChart>
            ) : chartType === 'line' ? (
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <Legend />
                {(revenueView === 'revenue' || revenueView === 'all') && (
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2 }} 
                    name="Revenue" 
                  />
                )}
                {(revenueView === 'expenses' || revenueView === 'all') && (
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#ef4444', strokeWidth: 2 }} 
                    name="Expenses" 
                  />
                )}
                {(revenueView === 'profit' || revenueView === 'all') && (
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2 }} 
                    name="Profit" 
                  />
                )}
              </LineChart>
            ) : (
              <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <Legend />
                {(revenueView === 'revenue' || revenueView === 'all') && (
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)"
                    name="Revenue"
                  />
                )}
                {(revenueView === 'expenses' || revenueView === 'all') && (
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorExpenses)"
                    name="Expenses"
                  />
                )}
                {(revenueView === 'profit' || revenueView === 'all') && (
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={2}
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
