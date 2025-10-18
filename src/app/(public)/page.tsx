// src/app/(public)/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Save, LogIn } from "lucide-react";
import { UploadDropzone } from "@/components/UploadDropzone";
import { Filters } from "@/components/Filters";
import { SummaryCards } from "@/components/SummaryCards";
import { ByHourChart } from "@/components/charts/ByHourChart";
import { ByItemChart } from "@/components/charts/ByItemChart";
import { AOVTimeline } from "@/components/charts/AOVTimeline";
import { OrderSizeHist } from "@/components/charts/OrderSizeHist";
import { PdfExportButton } from "@/components/PdfExportButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { useAuth } from "@/components/providers/AuthProvider";
import { saveAnalysis, updateAnalysisNote } from "@/lib/firebase/analysis";

const HomePage = () => {
  const { metrics, chartsPayload, filters, sourceMeta } = useAnalysisStore((state) => ({
    metrics: state.metrics,
    chartsPayload: state.chartsPayload,
    filters: state.filters,
    sourceMeta: state.sourceMeta,
  }));
  const { user, orgId, loading } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteValue, setNoteValue] = useState("");
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);

  const handleSave = async () => {
    if (!metrics || !chartsPayload || !sourceMeta) {
      setSaveStatus("保存できる解析結果がありません");
      return;
    }
    if (loading) {
      return;
    }
    if (!user || !orgId) {
      setLoginDialogOpen(true);
      return;
    }
    try {
      setSaving(true);
      const analysisId = await saveAnalysis({
        orgId,
        createdBy: user.uid,
        metrics,
        chartsPayload,
        filters,
        sourceMeta,
      });
      setSavedAnalysisId(analysisId);
      setNoteDialogOpen(true);
      setSaveStatus("保存しました。メモを入力できます。");
    } catch (error) {
      setSaveStatus(`保存中にエラーが発生しました: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitNote = async () => {
    if (!savedAnalysisId || !orgId) {
      setNoteDialogOpen(false);
      return;
    }
    try {
      await updateAnalysisNote(orgId, savedAnalysisId, noteValue.trim());
      setNoteDialogOpen(false);
      setNoteValue("");
      setSaveStatus("メモを保存しました");
    } catch (error) {
      setSaveStatus(`メモ保存中にエラーが発生しました: ${(error as Error).message}`);
    }
  };

  return (
    <main className="container mx-auto flex min-h-screen flex-col gap-6 px-4 py-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">売上分析ダッシュボード</h1>
          <p className="text-sm text-muted-foreground">
            CSVを取り込んで売上傾向を可視化。PDF出力やFirestoreへの保存が可能です。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PdfExportButton orgName={orgId ?? undefined} />
          <Button onClick={handleSave} disabled={saving || !metrics || !chartsPayload}>
            <Save className="mr-2 h-4 w-4" />
            保存
          </Button>
        </div>
      </section>

      <UploadDropzone />
      <Filters />
      <SummaryCards />

      <section>
        <Tabs defaultValue="hourly" className="mt-4">
          <TabsList className="mb-4">
            <TabsTrigger value="hourly">時間別売上</TabsTrigger>
            <TabsTrigger value="item">商品別売上</TabsTrigger>
            <TabsTrigger value="aov">AOV推移</TabsTrigger>
            <TabsTrigger value="size">注文サイズ分布</TabsTrigger>
          </TabsList>
          <TabsContent value="hourly">
            <ByHourChart />
          </TabsContent>
          <TabsContent value="item">
            <ByItemChart />
          </TabsContent>
          <TabsContent value="aov">
            <AOVTimeline />
          </TabsContent>
          <TabsContent value="size">
            <OrderSizeHist />
          </TabsContent>
        </Tabs>
      </section>

      {saveStatus && <p className="text-sm text-muted-foreground">{saveStatus}</p>}

      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>保存にはログインが必要です</DialogTitle>
            <DialogDescription>
              ログインまたは新規登録を行ってから保存してください。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />ログイン
              </Link>
            </Button>
            <Button asChild>
              <Link href="/register">新規登録</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メモを追加</DialogTitle>
            <DialogDescription>分析結果にメモを残せます（任意）。</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="イベント名や補足など"
            value={noteValue}
            onChange={(event) => setNoteValue(event.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNoteDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSubmitNote}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default HomePage;
