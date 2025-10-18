// src/components/PdfExportButton.tsx
"use client";

import { FileText } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { buildReport } from "@/lib/pdf/buildReport";

export const PdfExportButton = ({ orgName }: { orgName?: string }) => {
  const { metrics, chartsPayload, filters, sourceMeta } = useAnalysisStore(
    (state) => ({
      metrics: state.metrics,
      chartsPayload: state.chartsPayload,
      filters: state.filters,
      sourceMeta: state.sourceMeta,
    }),
  );

  if (!metrics || !chartsPayload) {
    return (
      <Button variant="outline" disabled>
        <FileText className="mr-2 h-4 w-4" />
        PDF出力
      </Button>
    );
  }

  const document = buildReport({
    orgName,
    metrics,
    chartsPayload,
    filters,
    sourceMeta,
    generatedAt: new Date(),
  });

  return (
    <PDFDownloadLink
      document={document}
      fileName={`analysis-${new Date().toISOString().slice(0, 19)}.pdf`}
      style={{ textDecoration: "none" }}
    >
      {({ loading }) => (
        <Button variant="outline" disabled={loading}>
          <FileText className="mr-2 h-4 w-4" />
          {loading ? "生成中..." : "PDF出力"}
        </Button>
      )}
    </PDFDownloadLink>
  );
};
