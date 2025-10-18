// src/types/sales.ts
import { parse, parseISO } from "date-fns";
import { z } from "zod";

const parseTimestamp = (value: unknown): Date => {
  if (typeof value !== "string") {
    throw new Error("Timestamp must be a string");
  }

  const isoDate = parseISO(value);
  if (!Number.isNaN(isoDate.getTime())) {
    return isoDate;
  }

  const fallback = parse(value, "yyyy-MM-dd HH:mm:ss", new Date());
  if (!Number.isNaN(fallback.getTime())) {
    return fallback;
  }

  throw new Error("Invalid timestamp");
};

export const SalesRowSchema = z.object({
  ts: z
    .string()
    .transform((val, ctx) => {
      try {
        return parseTimestamp(val);
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: (error as Error).message,
        });
        return z.NEVER;
      }
    }),
  orderNo: z.string().min(1, "orderNo is required"),
  lineNo: z.coerce.number().int().nonnegative(),
  name: z.string().min(1, "name is required"),
  qty: z.coerce.number().min(0),
  priceMode: z.string().min(1, "priceMode is required"),
  lineTotal: z.coerce.number().min(0),
});

export type SalesRow = z.infer<typeof SalesRowSchema>;

export type AnalysisFilters = {
  dateRange: {
    start: Date | null;
    end: Date | null;
  } | null;
  productName: string;
  priceModes: string[];
};

export type Metrics = {
  totalSales: number;
  orderCount: number;
  avgOrderValue: number;
  lineCount: number;
  priceModeBreakdown: Record<string, number>;
};

export type ChartsPayload = {
  byHour: Array<{ hour: string; sales: number; orders: number }>;
  byItem: Array<{ name: string; qty: number; sales: number }>;
  aovTimeline: Array<{ ts: string; aov: number }>;
  orderSizeHist: Array<{ size: number; count: number }>;
};
