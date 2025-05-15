
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { chartConfig } from '../config/chartConfig';

interface TechnicianPerformanceChartProps {
  data: Array<{
    name: string;
    efficiency: number;
    quality: number;
    customerRating: number;
  }>;
}

export const TechnicianPerformanceChart = ({ data }: TechnicianPerformanceChartProps) => {
  return (
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
            <BarChart data={data}>
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
  );
};
