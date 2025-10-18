// src/components/SummaryCards.tsx
"use client";

import { useMemo } from "react";
import { TrendingUp, ShoppingBag, Receipt, Rows, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { formatCurrency, formatNumber } from "@/lib/utils";

const MetricCard = ({
  title,
  value,
  icon,
  loading,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  loading: boolean;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {loading ? <Skeleton className="h-10 w-24" /> : <div className="text-2xl font-bold">{value}</div>}
    </CardContent>
  </Card>
);

export const SummaryCards = () => {
  const { metrics } = useAnalysisStore((state) => ({ metrics: state.metrics }));

  const breakdown = useMemo(() => {
    if (!metrics) {
      return [] as Array<{ mode: string; amount: number }>;
    }
    return Object.entries(metrics.priceModeBreakdown)
      .map(([mode, amount]) => ({ mode, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [metrics]);

  const loading = !metrics;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        title="総売上"
        value={metrics ? formatCurrency(metrics.totalSales) : "-"}
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        loading={loading}
      />
      <MetricCard
        title="注文数"
        value={metrics ? formatNumber(metrics.orderCount) : "-"}
        icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
        loading={loading}
      />
      <MetricCard
        title="平均注文単価 (AOV)"
        value={metrics ? formatCurrency(metrics.avgOrderValue) : "-"}
        icon={<Receipt className="h-4 w-4 text-muted-foreground" />}
        loading={loading}
      />
      <MetricCard
        title="行数"
        value={metrics ? formatNumber(metrics.lineCount) : "-"}
        icon={<Rows className="h-4 w-4 text-muted-foreground" />}
        loading={loading}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">priceMode内訳</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : breakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">データがありません</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {breakdown.map((entry) => (
                <li key={entry.mode} className="flex items-center justify-between">
                  <span>{entry.mode}</span>
                  <span className="font-semibold">{formatCurrency(entry.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
