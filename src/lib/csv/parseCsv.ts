// src/lib/csv/parseCsv.ts
import Papa from "papaparse";
import { SalesRowSchema, type SalesRow } from "@/types/sales";

type CsvError = {
  rowNumber: number;
  message: string;
  raw: Record<string, string>;
};

export type ParseCsvResult = {
  okRows: SalesRow[];
  errors: CsvError[];
};

const REQUIRED_COLUMNS = [
  "ts",
  "orderNo",
  "lineNo",
  "name",
  "qty",
  "priceMode",
  "lineTotal",
] as const;

type RequiredColumn = (typeof REQUIRED_COLUMNS)[number];

const pickRelevantColumns = (row: Record<string, string>): Record<RequiredColumn, string> => {
  const picked = {} as Record<RequiredColumn, string>;
  REQUIRED_COLUMNS.forEach((key) => {
    picked[key] = row[key] ?? "";
  });
  return picked;
};

export const parseCsv = (file: File): Promise<ParseCsvResult> =>
  new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      worker: false,
      complete: (result) => {
        const okRows: SalesRow[] = [];
        const errors: CsvError[] = [];

        result.data.slice(0, 1000).forEach((row, index) => {
          if (Object.values(row).every((value) => value === undefined || value === "")) {
            return;
          }

          const { success, data, error } = SalesRowSchema.safeParse(
            pickRelevantColumns(row),
          );

          if (success) {
            okRows.push(data);
          } else {
            const messages = error.issues.map((issue) => issue.message).join("; ");
            errors.push({
              rowNumber: index + 2,
              message: messages,
              raw: row,
            });
          }
        });

        resolve({ okRows, errors });
      },
      error: (error) => {
        reject(error);
      },
    });
  });

export const buildErrorCsv = (errors: CsvError[]): Blob => {
  const csv = Papa.unparse(
    errors.map((error) => ({
      rowNumber: error.rowNumber,
      message: error.message,
      ...error.raw,
    })),
  );

  return new Blob([csv], { type: "text/csv;charset=utf-8" });
};
