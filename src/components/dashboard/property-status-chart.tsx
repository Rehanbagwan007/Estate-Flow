'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Property } from '@/lib/types';
import { useMemo } from 'react';
import { usePropertyStore } from '@/lib/store/property-store';

const chartConfig = {
  count: {
    label: 'Count',
    color: 'hsl(var(--chart-1))',
  },
};

export function PropertyStatusChart() {
  const properties = usePropertyStore((state) => state.properties);

  const chartData = useMemo(() => {
    const statusCounts = properties.reduce((acc, prop) => {
        acc[prop.status] = (acc[prop.status] || 0) + 1;
        return acc;
    }, {} as Record<Property['status'], number>);
    
    return Object.entries(statusCounts).map(([status, count]) => ({
        status: status,
        count: count,
    }));
  }, [properties]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Status</CardTitle>
        <CardDescription>Overview of property inventory.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="max-h-[250px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="status"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 6)}
            />
            <YAxis />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
