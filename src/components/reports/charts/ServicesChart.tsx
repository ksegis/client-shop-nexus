
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { chartConfig } from '../config/chartConfig';

interface ServicesChartProps {
  data: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
}

const modernColors = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

export const ServicesChart = ({ data }: ServicesChartProps) => {
  const [serviceMetric, setServiceMetric] = useState("count");

  const sortedData = [...data].sort((a, b) => 
    serviceMetric === "count" 
      ? b.count - a.count 
      : b.revenue - a.revenue
  );

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
        <CardTitle className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Popular Services
        </CardTitle>
        <ToggleGroup 
          type="single" 
          value={serviceMetric} 
          onValueChange={(value) => value && setServiceMetric(value)}
          size="sm"
          className="bg-gray-100 rounded-lg p-1"
        >
          <ToggleGroupItem value="count" className="data-[state=on]:bg-white data-[state=on]:shadow-sm">
            Count
          </ToggleGroupItem>
          <ToggleGroupItem value="revenue" className="data-[state=on]:bg-white data-[state=on]:shadow-sm">
            Revenue
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer 
          config={chartConfig} 
          className="aspect-[4/3] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={sortedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                {modernColors.map((color, index) => (
                  <linearGradient key={index} id={`grad${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.9}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0.6}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Bar 
                dataKey={serviceMetric} 
                name={serviceMetric === "count" ? "Jobs" : "Revenue"}
                radius={[4, 4, 0, 0]}
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`url(#grad${index % modernColors.length})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
