// src/lib/firebase/analysis.ts
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import type { ChartsPayload, Metrics, AnalysisFilters } from "@/types/sales";
import { getFirebase } from "@/lib/firebase/client";

export type SourceMeta = {
  rows: number;
  fromCsvFileName?: string;
  timeRange: { start: string; end: string } | null;
};

type SaveAnalysisParams = {
  orgId: string;
  createdBy: string;
  metrics: Metrics;
  chartsPayload: ChartsPayload;
  filters: AnalysisFilters;
  sourceMeta: SourceMeta;
};

export type AnalysisDocument = SaveAnalysisParams & {
  createdAt: Date;
  note: string;
  id: string;
};

export const saveAnalysis = async (
  params: SaveAnalysisParams,
): Promise<string> => {
  const { firestore } = getFirebase();
  const orgRef = doc(firestore, "orgs", params.orgId);
  const analysesCollection = collection(orgRef, "analyses");
  const filtersPayload = {
    dateRange: params.filters.dateRange
      ? {
          start: params.filters.dateRange.start?.toISOString() ?? null,
          end: params.filters.dateRange.end?.toISOString() ?? null,
        }
      : null,
    productName: params.filters.productName,
    priceModes: params.filters.priceModes,
  };
  const docRef = await addDoc(analysesCollection, {
    createdAt: serverTimestamp(),
    createdBy: params.createdBy,
    metrics: params.metrics,
    chartsPayload: params.chartsPayload,
    filters: filtersPayload,
    sourceMeta: params.sourceMeta,
    note: "",
  });
  return docRef.id;
};

export const updateAnalysisNote = async (
  orgId: string,
  analysisId: string,
  note: string,
): Promise<void> => {
  const { firestore } = getFirebase();
  const analysisRef = doc(firestore, "orgs", orgId, "analyses", analysisId);
  await updateDoc(analysisRef, { note });
};

export const fetchAnalyses = async (orgId: string): Promise<AnalysisDocument[]> => {
  const { firestore } = getFirebase();
  const analysesQuery = query(
    collection(firestore, "orgs", orgId, "analyses"),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(analysesQuery);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as Omit<AnalysisDocument, "id" | "createdAt"> & {
      createdAt?: { seconds: number; nanoseconds: number };
      filters: {
        dateRange: { start: string | null; end: string | null } | null;
        productName: string;
        priceModes: string[];
      };
    };
    return {
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt
        ? new Date(data.createdAt.seconds * 1000 + data.createdAt.nanoseconds / 1_000_000)
        : new Date(),
      filters: {
        dateRange: data.filters.dateRange
          ? {
              start: data.filters.dateRange.start ? new Date(data.filters.dateRange.start) : null,
              end: data.filters.dateRange.end ? new Date(data.filters.dateRange.end) : null,
            }
          : null,
        productName: data.filters.productName,
        priceModes: data.filters.priceModes,
      },
    };
  });
};

export const fetchAnalysisById = async (
  orgId: string,
  analysisId: string,
): Promise<AnalysisDocument | null> => {
  const { firestore } = getFirebase();
  const ref = doc(firestore, "orgs", orgId, "analyses", analysisId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    return null;
  }
  const data = snapshot.data() as Omit<AnalysisDocument, "id" | "createdAt"> & {
    createdAt?: { seconds: number; nanoseconds: number };
    filters: {
      dateRange: { start: string | null; end: string | null } | null;
      productName: string;
      priceModes: string[];
    };
  };
  return {
    ...data,
    id: snapshot.id,
    createdAt: data.createdAt
      ? new Date(data.createdAt.seconds * 1000 + data.createdAt.nanoseconds / 1_000_000)
      : new Date(),
    filters: {
      dateRange: data.filters.dateRange
        ? {
            start: data.filters.dateRange.start ? new Date(data.filters.dateRange.start) : null,
            end: data.filters.dateRange.end ? new Date(data.filters.dateRange.end) : null,
          }
        : null,
      productName: data.filters.productName,
      priceModes: data.filters.priceModes,
    },
  };
};
