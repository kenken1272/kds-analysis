// src/components/Filters.tsx
"use client";

import { useMemo } from "react";
import { CalendarIcon, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAnalysisStore } from "@/store/useAnalysisStore";

const toInputValue = (date: Date | null): string => {
  if (!date) {
    return "";
  }
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
};

export const Filters = () => {
  const { filters, setFilters, rows } = useAnalysisStore((state) => ({
    filters: state.filters,
    setFilters: state.setFilters,
    rows: state.rows,
  }));

  const priceModes = useMemo(() => {
    const unique = new Set<string>();
    rows.forEach((row) => unique.add(row.priceMode));
    return Array.from(unique).sort();
  }, [rows]);

  const dateRange = filters.dateRange ?? { start: null, end: null };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="h-4 w-4" />
          フィルター
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setFilters({
              dateRange: null,
              priceModes: [],
              productName: "",
            })
          }
        >
          クリア
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            開始日時
          </label>
          <Input
            type="datetime-local"
            value={toInputValue(dateRange.start)}
            onChange={(event) => {
              const value = event.target.value;
              setFilters({
                dateRange: {
                  start: value ? new Date(value) : null,
                  end: dateRange.end ?? null,
                },
              });
            }}
          />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            終了日時
          </label>
          <Input
            type="datetime-local"
            value={toInputValue(dateRange.end)}
            onChange={(event) => {
              const value = event.target.value;
              setFilters({
                dateRange: {
                  start: dateRange.start ?? null,
                  end: value ? new Date(value) : null,
                },
              });
            }}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">商品名</label>
          <Input
            placeholder="例: Cバーガー"
            value={filters.productName}
            onChange={(event) => setFilters({ productName: event.target.value })}
          />
        </div>
        <div className="space-y-2 md:col-span-3">
          <label className="text-sm font-medium text-muted-foreground">priceMode</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {filters.priceModes.length > 0
                  ? filters.priceModes.join(", ")
                  : "すべて"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-60 w-full overflow-y-auto">
              {priceModes.map((mode) => (
                <DropdownMenuCheckboxItem
                  key={mode}
                  checked={filters.priceModes.includes(mode)}
                  onCheckedChange={(checked) => {
                    const isChecked = checked === true;
                    setFilters({
                      priceModes: isChecked
                        ? filters.priceModes.includes(mode)
                          ? filters.priceModes
                          : [...filters.priceModes, mode]
                        : filters.priceModes.filter((m) => m !== mode),
                    });
                  }}
                >
                  {mode}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};
