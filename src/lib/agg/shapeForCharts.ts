// src/lib/agg/shapeForCharts.ts
import { format } from "date-fns";
import type { ChartsPayload } from "@/types/sales";
import type { AggregationResult } from "./computeMetrics";

const formatHourLabel = (isoHour: string): string => {
  const date = new Date(isoHour);
  return Number.isNaN(date.getTime()) ? isoHour : format(date, "MM-dd HH:00");
};

export const shapeForCharts = (aggregation: AggregationResult): ChartsPayload => {
  const byHour = Array.from(aggregation.hourlyBuckets.entries())
    .map(([hour, bucket]) => ({
      hour,
      label: formatHourLabel(hour),
      sales: bucket.sales,
      orders: bucket.orderIds.size,
    }))
    .sort((a, b) => (a.hour > b.hour ? 1 : -1))
    .map(({ label, sales, orders }) => ({ hour: label, sales, orders }));

  const byItem = Array.from(aggregation.itemBuckets.entries())
    .map(([name, bucket]) => ({ name, qty: bucket.qty, sales: bucket.sales }))
    .sort((a, b) => b.sales - a.sales);

  const aovTimeline = Array.from(aggregation.hourlyBuckets.entries())
    .map(([hour, bucket]) => {
      const orders = bucket.orderIds.size;
      const aov = orders === 0 ? 0 : bucket.sales / orders;
      return { ts: hour, aov };
    })
    .sort((a, b) => (a.ts > b.ts ? 1 : -1))
    .map(({ ts, aov }) => ({ ts, aov }));

  const histogram = new Map<number, number>();
  aggregation.orderAggregates.forEach((order) => {
    const size = Math.round(order.qty);
    histogram.set(size, (histogram.get(size) ?? 0) + 1);
  });

  const orderSizeHist = Array.from(histogram.entries())
    .map(([size, count]) => ({ size, count }))
    .sort((a, b) => a.size - b.size);

  return {
    byHour,
    byItem,
    aovTimeline,
    orderSizeHist,
  };
};
