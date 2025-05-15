
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
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

export const ServicesChart = ({ data }: ServicesChartProps) => {
  const [serviceMetric, setServiceMetric] = useState("count");

  return (
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
                [...data].sort((a, b) => 
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
  );
};
