
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock performance data
const mockPerformanceData = [
  { name: '00:00', value: 80 },
  { name: '04:00', value: 78 },
  { name: '08:00', value: 92 },
  { name: '12:00', value: 85 },
  { name: '16:00', value: 90 },
  { name: '20:00', value: 88 },
  { name: 'Now', value: 95 },
];

const PerformanceChart: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance (24h)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={mockPerformanceData}
              margin={{
                top: 5,
                right: 10,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;
