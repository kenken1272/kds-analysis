// src/lib/pdf/buildReport.tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ChartsPayload, Metrics, AnalysisFilters } from "@/types/sales";
import type { SourceMeta } from "@/lib/firebase/analysis";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 12,
    fontFamily: "Helvetica",
    color: "#1f2933",
  },
  section: {
    marginBottom: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 4,
  },
  table: {
    display: "table",
    width: "auto",
    marginTop: 8,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCell: {
    borderStyle: "solid",
    borderColor: "#d1d5db",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderWidth: 1,
    padding: 6,
    fontSize: 11,
  },
  badge: {
    fontSize: 10,
    padding: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    marginRight: 4,
  },
});

const formatCurrency = (value: number): string =>
  `¥${Math.round(value).toLocaleString("ja-JP")}`;

const formatNumber = (value: number): string => value.toLocaleString("ja-JP");

const renderFilters = (filters: AnalysisFilters) => {
  const chips: string[] = [];
  if (filters.dateRange?.start) {
    chips.push(`開始: ${filters.dateRange.start.toISOString()}`);
  }
  if (filters.dateRange?.end) {
    chips.push(`終了: ${filters.dateRange.end.toISOString()}`);
  }
  if (filters.productName.trim().length > 0) {
    chips.push(`商品名: ${filters.productName}`);
  }
  if (filters.priceModes.length > 0) {
    chips.push(`priceMode: ${filters.priceModes.join(", ")}`);
  }
  if (chips.length === 0) {
    return <Text>適用されたフィルターはありません。</Text>;
  }
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {chips.map((chip) => (
        <Text key={chip} style={styles.badge}>
          {chip}
        </Text>
      ))}
    </View>
  );
};

const renderTable = (rows: Array<Record<string, string | number>>, headers: string[]) => (
  <View style={styles.table}>
    <View style={styles.tableRow}>
      {headers.map((header) => (
        <Text key={header} style={[styles.tableCell, { fontWeight: 700 }]}> 
          {header}
        </Text>
      ))}
    </View>
    {rows.map((row, index) => (
      <View key={index.toString()} style={styles.tableRow}>
        {headers.map((header) => (
          <Text key={header} style={styles.tableCell}>
            {row[header]}
          </Text>
        ))}
      </View>
    ))}
  </View>
);

type BuildReportParams = {
  orgName?: string;
  filters: AnalysisFilters;
  metrics: Metrics;
  chartsPayload: ChartsPayload;
  sourceMeta: SourceMeta | null;
  generatedAt: Date;
};

export const buildReport = ({
  orgName,
  filters,
  metrics,
  chartsPayload,
  sourceMeta,
  generatedAt,
}: BuildReportParams) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={[styles.section, { marginBottom: 24 }]}>
        <Text style={styles.heading}>{orgName ?? "未設定の団体"} - 売上分析レポート</Text>
        <Text>生成日時: {generatedAt.toLocaleString("ja-JP")}</Text>
        {sourceMeta?.timeRange && (
          <Text>
            対象期間: {sourceMeta.timeRange.start} 〜 {sourceMeta.timeRange.end}
          </Text>
        )}
        <Text>行数: {formatNumber(sourceMeta?.rows ?? 0)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.subheading}>適用フィルター</Text>
        {renderFilters(filters)}
      </View>

      <View style={styles.section}>
        <Text style={styles.subheading}>主要指標</Text>
        {renderTable(
          [
            {
              指標: "総売上",
              値: formatCurrency(metrics.totalSales),
            },
            {
              指標: "注文数",
              値: formatNumber(metrics.orderCount),
            },
            {
              指標: "平均注文単価",
              値: formatCurrency(metrics.avgOrderValue),
            },
            {
              指標: "行数",
              値: formatNumber(metrics.lineCount),
            },
          ],
          ["指標", "値"],
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.subheading}>priceMode内訳</Text>
        {renderTable(
          Object.entries(metrics.priceModeBreakdown).map(([mode, amount]) => ({
            priceMode: mode,
            金額: formatCurrency(amount),
          })),
          ["priceMode", "金額"],
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.subheading}>時間別売上</Text>
        {renderTable(
          chartsPayload.byHour.map((entry) => ({
            時間: entry.hour,
            売上: formatCurrency(entry.sales),
            注文数: formatNumber(entry.orders),
          })),
          ["時間", "売上", "注文数"],
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.subheading}>商品別売上（トップ10）</Text>
        {renderTable(
          chartsPayload.byItem.slice(0, 10).map((entry) => ({
            商品名: entry.name,
            金額: formatCurrency(entry.sales),
            数量: formatNumber(entry.qty),
          })),
          ["商品名", "金額", "数量"],
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.subheading}>AOV推移</Text>
        {renderTable(
          chartsPayload.aovTimeline.map((entry) => ({
            時間: entry.ts,
            AOV: formatCurrency(entry.aov),
          })),
          ["時間", "AOV"],
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.subheading}>注文サイズ分布</Text>
        {renderTable(
          chartsPayload.orderSizeHist.map((entry) => ({
            サイズ: formatNumber(entry.size),
            件数: formatNumber(entry.count),
          })),
          ["サイズ", "件数"],
        )}
      </View>
    </Page>
  </Document>
);
