
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
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
            <LineChart data={data}>
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
  );
};
