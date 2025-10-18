// src/store/useAnalysisStore.ts
import { create } from "zustand";
import type {
  AnalysisFilters,
  ChartsPayload,
  Metrics,
  SalesRow,
} from "@/types/sales";
import { computeMetrics } from "@/lib/agg/computeMetrics";
import { shapeForCharts } from "@/lib/agg/shapeForCharts";

type SourceMeta = {
  rows: number;
  fromCsvFileName?: string;
  timeRange: { start: string; end: string } | null;
};

type AnalysisState = {
  rows: SalesRow[];
  filters: AnalysisFilters;
  metrics: Metrics | null;
  chartsPayload: ChartsPayload | null;
  sourceMeta: SourceMeta | null;
  setRows: (payload: { rows: SalesRow[]; fileName?: string }) => void;
  setFilters: (filters: Partial<AnalysisFilters>) => void;
  recompute: () => void;
  reset: () => void;
};

const defaultFilters: AnalysisFilters = {
  dateRange: null,
  productName: "",
  priceModes: [],
};

const applyFilters = (rows: SalesRow[], filters: AnalysisFilters): SalesRow[] => {
  return rows.filter((row) => {
    if (filters.dateRange?.start && row.ts < filters.dateRange.start) {
      return false;
    }
    if (filters.dateRange?.end && row.ts > filters.dateRange.end) {
      return false;
    }
    if (
      filters.productName.trim().length > 0 &&
      !row.name.toLowerCase().includes(filters.productName.trim().toLowerCase())
    ) {
      return false;
    }
    if (
      filters.priceModes.length > 0 &&
      !filters.priceModes.includes(row.priceMode)
    ) {
      return false;
    }
    return true;
  });
};

const deriveTimeRange = (rows: SalesRow[]): { start: string; end: string } | null => {
  if (rows.length === 0) {
    return null;
  }
  const sorted = [...rows].sort((a, b) => a.ts.getTime() - b.ts.getTime());
  return {
    start: sorted[0].ts.toISOString(),
    end: sorted[sorted.length - 1].ts.toISOString(),
  };
};

const computeState = (rows: SalesRow[], filters: AnalysisFilters) => {
  const filteredRows = applyFilters(rows, filters);
  const aggregation = computeMetrics(filteredRows);
  const chartsPayload = shapeForCharts(aggregation);
  return {
    metrics: aggregation.metrics,
    chartsPayload,
    filteredRows,
  };
};

export const useAnalysisStore = create<AnalysisState>()((set, get) => ({
  rows: [],
  filters: defaultFilters,
  metrics: null,
  chartsPayload: null,
  sourceMeta: null,
  setRows: ({ rows, fileName }) => {
    const timeRange = deriveTimeRange(rows);
    const { metrics, chartsPayload } = computeState(rows, get().filters);
    set({
      rows,
      metrics,
      chartsPayload,
      sourceMeta: {
        rows: rows.length,
        fromCsvFileName: fileName,
        timeRange,
      },
    });
  },
  setFilters: (filters) => {
    const nextFilters = { ...get().filters, ...filters };
    const { metrics, chartsPayload } = computeState(get().rows, nextFilters);
    set({ filters: nextFilters, metrics, chartsPayload });
  },
  recompute: () => {
    const { metrics, chartsPayload } = computeState(get().rows, get().filters);
    set({ metrics, chartsPayload });
  },
  reset: () => {
    set({
      rows: [],
      filters: defaultFilters,
      metrics: null,
      chartsPayload: null,
      sourceMeta: null,
    });
  },
}));
