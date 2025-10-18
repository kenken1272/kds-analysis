// src/components/UploadDropzone.tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileWarning, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildErrorCsv, parseCsv } from "@/lib/csv/parseCsv";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";

const DropIndicator = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <UploadCloud className="h-4 w-4" />
    <span>{label}</span>
  </div>
);

export const UploadDropzone = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { setRows, rows, sourceMeta } = useAnalysisStore((state) => ({
    setRows: state.setRows,
    rows: state.rows,
    sourceMeta: state.sourceMeta,
  }));
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [errorCsvUrl, setErrorCsvUrl] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) {
        return;
      }
      const file = fileList[0];
      const isCsv = file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");
      if (!isCsv) {
        setStatusMessage("CSVファイルを選択してください");
        return;
      }
      setIsParsing(true);
      setStatusMessage("");
      setErrorCount(0);
      if (errorCsvUrl) {
        URL.revokeObjectURL(errorCsvUrl);
        setErrorCsvUrl(null);
      }
      try {
        const result = await parseCsv(file);
        if (result.okRows.length === 0) {
          setStatusMessage("有効なデータ行が見つかりませんでした");
          setRows({ rows: [], fileName: file.name });
        } else {
          setRows({ rows: result.okRows, fileName: file.name });
          setStatusMessage(`${formatNumber(result.okRows.length)}件の行を読み込みました`);
        }
        if (result.errors.length > 0) {
          const blob = buildErrorCsv(result.errors);
          const url = URL.createObjectURL(blob);
          setErrorCsvUrl(url);
          setErrorCount(result.errors.length);
        }
      } catch (error) {
        setStatusMessage(`解析中にエラーが発生しました: ${(error as Error).message}`);
      } finally {
        setIsParsing(false);
      }
    },
    [errorCsvUrl, setRows],
  );

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      await handleFiles(event.dataTransfer.files);
    },
    [handleFiles],
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>CSVアップロード</CardTitle>
        <Button variant="outline" onClick={() => inputRef.current?.click()}>
          ファイルを選択
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </CardHeader>
      <CardContent>
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`flex min-h-[180px] flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed ${
            isDragging ? "border-primary bg-primary/5" : "border-muted"
          } p-8 text-center`}
        >
          {isParsing ? (
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-16 w-48" />
              <span className="text-sm text-muted-foreground">解析中です…</span>
            </div>
          ) : rows.length > 0 ? (
            <div className="flex flex-col items-center gap-2 text-sm">
              <CheckCircle2 className="h-8 w-8 text-primary" />
              <span className="font-semibold">データを読み込み済み</span>
              {sourceMeta?.fromCsvFileName && (
                <span className="text-muted-foreground">{sourceMeta.fromCsvFileName}</span>
              )}
            </div>
          ) : (
            <DropIndicator label="ここにCSVをドラッグ&ドロップ、またはクリックして選択" />
          )}
        </div>
        {statusMessage && (
          <p className="mt-4 text-sm text-muted-foreground">{statusMessage}</p>
        )}
        {errorCount > 0 && errorCsvUrl && (
          <div className="mt-4 flex items-center justify-between rounded-md bg-destructive/10 p-3 text-sm">
            <div className="flex items-center gap-2 text-destructive">
              <FileWarning className="h-4 w-4" />
              <span>{formatNumber(errorCount)}件のエラー行があります</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const anchor = document.createElement("a");
                anchor.href = errorCsvUrl;
                anchor.download = "errors.csv";
                anchor.click();
              }}
            >
              エラーCSVをダウンロード
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
