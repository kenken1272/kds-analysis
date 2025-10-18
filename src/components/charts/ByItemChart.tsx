// src/components/charts/ByItemChart.tsx
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
  LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/lib/utils";

const MAX_ITEMS = 10;

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
          {entry.name === "数量" ? formatNumber(entry.value) : formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

export const ByItemChart = () => {
  const chartsPayload = useAnalysisStore((state) => state.chartsPayload);

  if (!chartsPayload) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>商品別売上</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-60 w-full" />
        </CardContent>
      </Card>
    );
  }

  const items = chartsPayload.byItem.slice(0, MAX_ITEMS).reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>商品別売上（トップ{Math.min(MAX_ITEMS, chartsPayload.byItem.length)}件）</CardTitle>
      </CardHeader>
      <CardContent className="h-[340px]">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">データがありません</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={items} layout="vertical" margin={{ left: 16, right: 32 }}>
              <CartesianGrid strokeDasharray="4 4" horizontal={false} />
              <XAxis type="number" tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
              <YAxis dataKey="name" type="category" width={160} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="sales"
                name="売上"
                fill="hsl(var(--primary))"
                radius={[0, 6, 6, 0]}
              >
                <LabelList
                  dataKey="qty"
                  position="right"
                  className="text-xs text-muted-foreground"
                  formatter={(value: number) => `数量 ${formatNumber(value)}`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
