
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { chartConfig } from '../config/chartConfig';

interface SatisfactionChartProps {
  data: Array<{
    month: string;
    score: number;
  }>;
}

export const SatisfactionChart = ({ data }: SatisfactionChartProps) => {
  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-4 border-b border-gray-100">
        <CardTitle className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Customer Satisfaction
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">Average rating out of 5 stars</p>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer 
          config={chartConfig} 
          className="aspect-[4/3] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="satisfactionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis 
                domain={[0, 5]} 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
              />
              <Area
                type="monotone" 
                dataKey="score" 
                stroke="#f97316" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#satisfactionGradient)"
                name="Rating (0-5)"
                dot={{ fill: '#f97316', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#f97316', strokeWidth: 2, fill: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
