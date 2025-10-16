'use client';

import { Pie, PieChart, Cell } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Lead } from '@/lib/types';
import { useMemo } from 'react';
import { useLeadStore } from '@/lib/store/lead-store';

const chartConfig = {
  Hot: {
    label: 'Hot',
    color: 'hsl(var(--chart-1))',
  },
  Warm: {
    label: 'Warm',
    color: 'hsl(var(--chart-2))',
  },
  Cold: {
    label: 'Cold',
    color: 'hsl(var(--chart-3))',
  },
};

export function LeadsByStatusChart() {
  const leads = useLeadStore((state) => state.leads);

  const chartData = useMemo(() => {
    const statusCounts = leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
    }, {} as Record<Lead['status'], number>);
    
    return Object.entries(statusCounts).map(([status, count]) => ({
        status: status,
        count: count,
        fill: chartConfig[status as keyof typeof chartConfig]?.color || 'hsl(var(--chart-5))',
    }));
  }, [leads]);
  
  const totalLeads = useMemo(() => leads.length, [leads]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Leads by Status</CardTitle>
        <CardDescription>Distribution of all leads.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              strokeWidth={5}
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.status}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Total Leads: {totalLeads}
        </div>
        <div className="flex items-center gap-2 leading-none text-muted-foreground">
          Updated just now
        </div>
      </CardFooter>
    </Card>
  );
}
