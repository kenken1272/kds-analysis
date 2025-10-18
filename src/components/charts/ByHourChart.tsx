// src/components/charts/ByHourChart.tsx
"use client";

import {
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/lib/utils";

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  return (
    <div className="rounded-md border bg-background p-3 text-sm shadow">
      <p className="font-semibold">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-muted-foreground">
          {entry.name}: {entry.name === "売上" ? formatCurrency(entry.value) : formatNumber(entry.value)}
        </p>
      ))}
    </div>
  );
};

export const ByHourChart = () => {
  const chartsPayload = useAnalysisStore((state) => state.chartsPayload);

  if (!chartsPayload) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>時間別売上</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-60 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>時間別売上</CardTitle>
      </CardHeader>
      <CardContent className="h-[340px]">
        {chartsPayload.byHour.length === 0 ? (
          <p className="text-sm text-muted-foreground">データがありません</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartsPayload.byHour}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="hour" tickLine={false} axisLine={false} />
              <YAxis
                yAxisId="left"
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="sales"
                name="売上"
                fill="hsl(var(--primary))"
                radius={[6, 6, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                name="注文数"
                stroke="hsl(var(--secondary-foreground))"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
