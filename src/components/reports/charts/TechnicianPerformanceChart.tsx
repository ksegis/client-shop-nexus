
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
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
    <Card className="col-span-2 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-4 border-b border-gray-100">
        <CardTitle className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Technician Performance
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">Efficiency, quality scores and customer ratings</p>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer 
          config={chartConfig} 
          className="aspect-[4/2] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="efficiencyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.6}/>
                </linearGradient>
                <linearGradient id="qualityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#84cc16" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#84cc16" stopOpacity={0.6}/>
                </linearGradient>
                <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 5]}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />} 
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Legend />
              <Bar 
                yAxisId="left" 
                dataKey="efficiency" 
                name="Efficiency %" 
                fill="url(#efficiencyGrad)"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                yAxisId="left" 
                dataKey="quality" 
                name="Quality %" 
                fill="url(#qualityGrad)"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                yAxisId="right" 
                dataKey="customerRating" 
                name="Rating (0-5)" 
                fill="url(#ratingGrad)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
