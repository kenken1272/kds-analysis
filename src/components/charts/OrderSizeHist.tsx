// src/components/charts/OrderSizeHist.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";

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
      <p className="font-semibold">注文サイズ: {label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-muted-foreground">
          {entry.name}: {formatNumber(entry.value)}
        </p>
      ))}
    </div>
  );
};

export const OrderSizeHist = () => {
  const chartsPayload = useAnalysisStore((state) => state.chartsPayload);

  if (!chartsPayload) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>注文サイズ分布</CardTitle>
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
        <CardTitle>注文サイズ分布</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        {chartsPayload.orderSizeHist.length === 0 ? (
          <p className="text-sm text-muted-foreground">データがありません</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartsPayload.orderSizeHist}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="size" tickFormatter={(value) => formatNumber(value)} />
              <YAxis allowDecimals={false} tickFormatter={(value) => formatNumber(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="count"
                name="件数"
                fill="hsl(var(--primary))"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
