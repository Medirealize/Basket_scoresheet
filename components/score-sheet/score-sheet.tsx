"use client"

import { useState } from "react"
import { ScoreProvider, useScore } from "@/lib/score-context"
import { GameInfoForm } from "./game-info-form"
import { TeamInfoForm } from "./team-info-form"
import { PlayerRosterForm } from "./player-roster-form"
import { RunningScore } from "./running-score"
import { CombinedScoreGrid } from "./combined-score-grid"
import { QuarterControl } from "./quarter-control"
import { TimeoutFoulPanel } from "./timeout-foul-panel"
import { TimeoutBar } from "./timeout-bar"
import { OfficialsForm } from "./officials-form"
import { FinalResultPanel } from "./final-result-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  ClipboardList,
  Users,
  Timer,
  Trophy,
  RotateCcw,
  Info,
  User,
  Clock,
} from "lucide-react"

function ScoreSheetContent() {
  const { resetState } = useScore()
  const [activeTab, setActiveTab] = useState("score")

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="sticky top-0 z-20 bg-card border-b px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold">バスケスコアシート</h1>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <RotateCcw className="h-4 w-4 mr-1" />
                リセット
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>データをリセットしますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  すべての入力データが削除されます。この操作は取り消せません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction onClick={resetState}>リセット</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="score" className="mt-0 space-y-4 p-4">
            <QuarterControl />
            {/* タイムアウトバー */}
            <TimeoutBar />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RunningScore team="A" />
              <RunningScore team="B" />
            </div>
            {/* ランニングスコア表（1〜160点） - 両チーム統合 */}
            <CombinedScoreGrid />
          </TabsContent>

          <TabsContent value="players" className="mt-0 space-y-4 p-4">
            <PlayerRosterForm team="A" />
            <PlayerRosterForm team="B" />
          </TabsContent>

          <TabsContent value="info" className="mt-0 space-y-4 p-4">
            <GameInfoForm />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TeamInfoForm team="A" />
              <TeamInfoForm team="B" />
            </div>
            <OfficialsForm />
          </TabsContent>

          <TabsContent value="timeout" className="mt-0 space-y-4 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TimeoutFoulPanel team="A" />
              <TimeoutFoulPanel team="B" />
            </div>
          </TabsContent>

          <TabsContent value="result" className="mt-0 space-y-4 p-4">
            <FinalResultPanel />
          </TabsContent>

          {/* ボトムナビゲーション - 順番変更: スコア, 選手, 試合情報, TO, 結果 */}
          <TabsList className="fixed bottom-0 left-0 right-0 h-auto p-2 bg-card border-t rounded-none grid grid-cols-5 gap-1 z-20">
            <TabsTrigger
              value="score"
              className="flex flex-col gap-1 h-14 bg-orange-500 text-white data-[state=active]:bg-orange-600 data-[state=active]:text-white hover:bg-orange-600"
            >
              <Timer className="h-5 w-5" />
              <span className="text-[10px] font-bold">スコア</span>
            </TabsTrigger>
            <TabsTrigger
              value="players"
              className="flex flex-col gap-1 h-14 bg-blue-500 text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:bg-blue-600"
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] font-bold">選手</span>
            </TabsTrigger>
            <TabsTrigger
              value="info"
              className="flex flex-col gap-1 h-14 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Info className="h-5 w-5" />
              <span className="text-[10px]">試合情報</span>
            </TabsTrigger>
            <TabsTrigger
              value="timeout"
              className="flex flex-col gap-1 h-14 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Clock className="h-5 w-5" />
              <span className="text-[10px]">TO</span>
            </TabsTrigger>
            <TabsTrigger
              value="result"
              className="flex flex-col gap-1 h-14 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Trophy className="h-5 w-5" />
              <span className="text-[10px]">結果</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </main>
    </div>
  )
}

export function ScoreSheet() {
  return (
    <ScoreProvider>
      <ScoreSheetContent />
    </ScoreProvider>
  )
}
