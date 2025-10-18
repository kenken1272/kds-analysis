// src/lib/agg/computeMetrics.ts
import { startOfHour } from "date-fns";
import type { Metrics, SalesRow } from "@/types/sales";

type HourBucket = {
  sales: number;
  orderIds: Set<string>;
};

type ItemBucket = {
  qty: number;
  sales: number;
};

type OrderAggregate = {
  total: number;
  qty: number;
  hourKey: string;
};

export type AggregationResult = {
  metrics: Metrics;
  hourlyBuckets: Map<string, HourBucket>;
  itemBuckets: Map<string, ItemBucket>;
  orderAggregates: Map<string, OrderAggregate>;
};

export const computeMetrics = (rows: SalesRow[]): AggregationResult => {
  let totalSales = 0;
  const priceModeBreakdown: Record<string, number> = {};
  const hourlyBuckets = new Map<string, HourBucket>();
  const itemBuckets = new Map<string, ItemBucket>();
  const orderAggregates = new Map<string, OrderAggregate>();

  rows.forEach((row) => {
    totalSales += row.lineTotal;

    priceModeBreakdown[row.priceMode] =
      (priceModeBreakdown[row.priceMode] ?? 0) + row.lineTotal;

    const hourKey = startOfHour(row.ts).toISOString();
    const hourBucket = hourlyBuckets.get(hourKey) ?? {
      sales: 0,
      orderIds: new Set<string>(),
    };
    hourBucket.sales += row.lineTotal;
    hourBucket.orderIds.add(row.orderNo);
    hourlyBuckets.set(hourKey, hourBucket);

    const itemBucket = itemBuckets.get(row.name) ?? { qty: 0, sales: 0 };
    itemBucket.qty += row.qty;
    itemBucket.sales += row.lineTotal;
    itemBuckets.set(row.name, itemBucket);

    const existingOrder = orderAggregates.get(row.orderNo) ?? {
      total: 0,
      qty: 0,
      hourKey,
    };
    existingOrder.total += row.lineTotal;
    existingOrder.qty += row.qty;
    orderAggregates.set(row.orderNo, existingOrder);
  });

  const orderCount = orderAggregates.size;
  const avgOrderValue = orderCount === 0 ? 0 : totalSales / orderCount;

  return {
    metrics: {
      totalSales,
      orderCount,
      avgOrderValue,
      lineCount: rows.length,
      priceModeBreakdown,
    },
    hourlyBuckets,
    itemBuckets,
    orderAggregates,
  };
};
