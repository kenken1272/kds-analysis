// src/app/saved/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  BarChart,
  LineChart,
} from "recharts";
import { format } from "date-fns";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchAnalyses, type AnalysisDocument } from "@/lib/firebase/analysis";
import { buildReport } from "@/lib/pdf/buildReport";
import { formatCurrency, formatNumber } from "@/lib/utils";

const formatDate = (date: Date): string => format(date, "yyyy/MM/dd HH:mm");

const HourlyChart = ({ data }: { data: AnalysisDocument["chartsPayload"]["byHour"] }) => (
  <ResponsiveContainer width="100%" height={280}>
    <ComposedChart data={data}>
      <CartesianGrid strokeDasharray="4 4" vertical={false} />
      <XAxis dataKey="hour" tickLine={false} axisLine={false} />
      <YAxis yAxisId="left" tickFormatter={(value) => `${Math.round(value / 1000)}k`} axisLine={false} tickLine={false} />
      <YAxis yAxisId="right" orientation="right" allowDecimals={false} axisLine={false} tickLine={false} />
      <Tooltip />
      <Legend />
      <Bar yAxisId="left" dataKey="sales" name="売上" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
      <Line yAxisId="right" type="monotone" dataKey="orders" name="注文数" stroke="hsl(var(--secondary-foreground))" strokeWidth={2} dot={false} />
    </ComposedChart>
  </ResponsiveContainer>
);

const ItemChart = ({ data }: { data: AnalysisDocument["chartsPayload"]["byItem"] }) => (
  <ResponsiveContainer width="100%" height={280}>
    <BarChart data={data.slice(0, 10).reverse()} layout="vertical" margin={{ left: 16, right: 32 }}>
      <CartesianGrid strokeDasharray="4 4" horizontal={false} />
      <XAxis type="number" tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
      <YAxis dataKey="name" type="category" width={160} />
      <Tooltip />
      <Legend />
      <Bar dataKey="sales" name="売上" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

const AovChart = ({ data }: { data: AnalysisDocument["chartsPayload"]["aovTimeline"] }) => (
  <ResponsiveContainer width="100%" height={240}>
    <LineChart
      data={data.map((entry) => ({
        ...entry,
        label: format(new Date(entry.ts), "MM/dd HH:mm"),
      }))}
    >
      <CartesianGrid strokeDasharray="4 4" />
      <XAxis dataKey="label" tickLine={false} axisLine={false} />
      <YAxis tickFormatter={(value) => `${Math.round(value)}`} axisLine={false} tickLine={false} />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="aov" name="平均注文単価" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
    </LineChart>
  </ResponsiveContainer>
);

const SizeChart = ({ data }: { data: AnalysisDocument["chartsPayload"]["orderSizeHist"] }) => (
  <ResponsiveContainer width="100%" height={240}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="4 4" vertical={false} />
      <XAxis dataKey="size" tickFormatter={(value) => formatNumber(value)} />
      <YAxis allowDecimals={false} tickFormatter={(value) => formatNumber(value)} />
      <Tooltip />
      <Legend />
      <Bar dataKey="count" name="件数" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

const SavedPage = () => {
  const { user, orgId, loading } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisDocument[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      if (!orgId) {
        setAnalyses([]);
        return;
      }
      try {
        setFetching(true);
        const result = await fetchAnalyses(orgId);
        setAnalyses(result);
        setSelectedId(result[0]?.id ?? null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setFetching(false);
      }
    };
    if (!loading) {
      void load();
    }
  }, [orgId, loading]);

  const selected = useMemo(
    () => analyses.find((analysis) => analysis.id === selectedId) ?? null,
    [analyses, selectedId],
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-24 w-24" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold">ログインが必要です。</p>
        <Button asChild>
          <Link href="/login">ログイン画面へ</Link>
        </Button>
      </main>
    );
  }

  if (!orgId) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">組織情報が見つかりません。管理者にお問い合わせください。</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto flex min-h-screen flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">保存済み分析</h1>
        <p className="text-sm text-muted-foreground">Firestoreに保存した分析一覧を確認できます。</p>
      </header>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {fetching ? (
            <Skeleton className="h-32 w-full" />
          ) : analyses.length === 0 ? (
            <p className="text-sm text-muted-foreground">まだ保存された分析はありません。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>作成日時</TableHead>
                  <TableHead>総売上</TableHead>
                  <TableHead>注文数</TableHead>
                  <TableHead>メモ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map((analysis) => (
                  <TableRow
                    key={analysis.id}
                    className={`cursor-pointer ${selectedId === analysis.id ? "bg-muted" : ""}`}
                    onClick={() => setSelectedId(analysis.id)}
                  >
                    <TableCell>{formatDate(analysis.createdAt)}</TableCell>
                    <TableCell>{formatCurrency(analysis.metrics.totalSales)}</TableCell>
                    <TableCell>{formatNumber(analysis.metrics.orderCount)}</TableCell>
                    <TableCell className="truncate text-muted-foreground">{analysis.note || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>クリックで詳細を確認できます。</TableCaption>
            </Table>
          )}
        </CardContent>
      </Card>

      {selected && (
        <section className="grid gap-4 lg:grid-cols-[2fr,3fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>概要</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">作成日時:</span> {formatDate(selected.createdAt)}
                </p>
                {selected.sourceMeta.timeRange && (
                  <p>
                    <span className="font-medium">対象期間:</span> {selected.sourceMeta.timeRange.start} 〜 {selected.sourceMeta.timeRange.end}
                  </p>
                )}
                <p>
                  <span className="font-medium">総売上:</span> {formatCurrency(selected.metrics.totalSales)}
                </p>
                <p>
                  <span className="font-medium">注文数:</span> {formatNumber(selected.metrics.orderCount)}
                </p>
                <p>
                  <span className="font-medium">平均注文単価:</span> {formatCurrency(selected.metrics.avgOrderValue)}
                </p>
                <p>
                  <span className="font-medium">メモ:</span> {selected.note || "-"}
                </p>
                <PDFDownloadLink
                  document={buildReport({
                    orgName: orgId,
                    filters: selected.filters,
                    metrics: selected.metrics,
                    chartsPayload: selected.chartsPayload,
                    sourceMeta: selected.sourceMeta,
                    generatedAt: new Date(),
                  })}
                  fileName={`analysis-${selected.id}.pdf`}
                  style={{ textDecoration: "none" }}
                >
                  {({ loading: pdfLoading }) => (
                    <Button variant="outline" disabled={pdfLoading}>
                      {pdfLoading ? "PDF生成中..." : "PDFをダウンロード"}
                    </Button>
                  )}
                </PDFDownloadLink>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>priceMode内訳</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {Object.entries(selected.metrics.priceModeBreakdown).map(([mode, value]) => (
                    <li key={mode} className="flex items-center justify-between">
                      <span>{mode}</span>
                      <span className="font-semibold">{formatCurrency(value)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>時間別売上</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <HourlyChart data={selected.chartsPayload.byHour} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>商品別売上（トップ10）</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ItemChart data={selected.chartsPayload.byItem} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>AOV推移</CardTitle>
              </CardHeader>
              <CardContent className="h-[260px]">
                <AovChart data={selected.chartsPayload.aovTimeline} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>注文サイズ分布</CardTitle>
              </CardHeader>
              <CardContent className="h-[260px]">
                <SizeChart data={selected.chartsPayload.orderSizeHist} />
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </main>
  );
};

export default SavedPage;
