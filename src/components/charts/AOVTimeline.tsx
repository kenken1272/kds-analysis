// src/components/charts/AOVTimeline.tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

const formatLabel = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : format(date, "MM-dd HH:mm");
};

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
      <p className="font-semibold">{formatLabel(label ?? "")}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-muted-foreground">
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

export const AOVTimeline = () => {
  const chartsPayload = useAnalysisStore((state) => state.chartsPayload);

  if (!chartsPayload) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AOV推移</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-60 w-full" />
        </CardContent>
      </Card>
    );
  }

  const timeline = chartsPayload.aovTimeline.map((entry) => ({
    ...entry,
    label: formatLabel(entry.ts),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>AOV推移</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">データがありません</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="4 4" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => `${Math.round(value)}`} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="aov"
                name="平均注文単価"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
