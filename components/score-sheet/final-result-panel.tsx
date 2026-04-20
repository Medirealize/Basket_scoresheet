"use client"

import { useState } from "react"
import { useScore } from "@/lib/score-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Trophy, Download, Printer, ArrowLeft } from "lucide-react"
import { PrintScoreSheet } from "./print-score-sheet"

export function FinalResultPanel() {
  const { state, setWinner, getTotalScore, getQuarterScore } = useScore()
  const [printDialogOpen, setPrintDialogOpen] = useState(false)

  const scoreA = getTotalScore("A")
  const scoreB = getTotalScore("B")

  const quarterScores = [1, 2, 3, 4, 5].map((q) => ({
    quarter: q,
    teamA: getQuarterScore("A", q),
    teamB: getQuarterScore("B", q),
  }))

  const handleExport = () => {
    const data = {
      試合情報: state.gameInfo,
      チームA: {
        名前: state.teamA.name,
        組み合わせ番号: state.teamA.combinationNumber,
        コーチ: state.teamA.coach,
        選手: state.teamA.players.filter((p) => p.number).map((p) => ({
          背番号: p.number,
          氏名: p.name,
          キャプテン: p.isCaptain,
          ファウル: p.fouls,
        })),
      },
      チームB: {
        名前: state.teamB.name,
        組み合わせ番号: state.teamB.combinationNumber,
        コーチ: state.teamB.coach,
        選手: state.teamB.players.filter((p) => p.number).map((p) => ({
          背番号: p.number,
          氏名: p.name,
          キャプテン: p.isCaptain,
          ファウル: p.fouls,
        })),
      },
      クォーター別スコア: quarterScores,
      最終スコア: { チームA: scoreA, チームB: scoreB },
      勝者: state.winner,
      審判オフィシャルズ: state.officials,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `スコアシート_${state.gameInfo.date || "未設定"}_${state.teamA.name || "A"}_vs_${state.teamB.name || "B"}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    setPrintDialogOpen(true)
    setTimeout(() => {
      window.print()
    }, 100)
  }

  return (
    <>
      <Card className="border-2 border-primary">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            最終結果
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 最終スコア */}
          <div className="flex items-center justify-center gap-6 py-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">
                {state.teamA.name || "チームA"}
              </div>
              <div className={cn(
                "text-5xl font-bold font-mono",
                scoreA > scoreB && "text-primary"
              )}>
                {scoreA}
              </div>
            </div>
            <div className="text-3xl text-muted-foreground">-</div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">
                {state.teamB.name || "チームB"}
              </div>
              <div className={cn(
                "text-5xl font-bold font-mono",
                scoreB > scoreA && "text-accent"
              )}>
                {scoreB}
              </div>
            </div>
          </div>

          {/* クォーター別スコア表 */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">チーム</th>
                  {quarterScores.map((q) => (
                    <th
                      key={q.quarter}
                      className={cn(
                        "text-center py-2 px-2 min-w-12",
                        (q.quarter === 1 || q.quarter === 3) && "text-red-600"
                      )}
                    >
                      {q.quarter <= 4 ? `${q.quarter}Q` : "OT"}
                    </th>
                  ))}
                  <th className="text-center py-2 px-2 font-bold">計</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-2 font-medium">
                    {state.teamA.name || "チームA"}
                  </td>
                  {quarterScores.map((q) => (
                    <td
                      key={q.quarter}
                      className={cn(
                        "text-center py-2 px-2 font-mono",
                        (q.quarter === 1 || q.quarter === 3) && "text-red-600"
                      )}
                    >
                      {q.teamA}
                    </td>
                  ))}
                  <td className="text-center py-2 px-2 font-mono font-bold">{scoreA}</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-medium">
                    {state.teamB.name || "チームB"}
                  </td>
                  {quarterScores.map((q) => (
                    <td
                      key={q.quarter}
                      className={cn(
                        "text-center py-2 px-2 font-mono",
                        (q.quarter === 1 || q.quarter === 3) && "text-red-600"
                      )}
                    >
                      {q.teamB}
                    </td>
                  ))}
                  <td className="text-center py-2 px-2 font-mono font-bold">{scoreB}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 勝者選択 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">勝者チーム</label>
            <Select value={state.winner} onValueChange={setWinner}>
              <SelectTrigger>
                <SelectValue placeholder="勝者を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={state.teamA.name || "チームA"}>
                  {state.teamA.name || "チームA"}
                </SelectItem>
                <SelectItem value={state.teamB.name || "チームB"}>
                  {state.teamB.name || "チームB"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ボタン */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handlePrint} className="w-full">
              <Printer className="h-4 w-4 mr-2" />
              A4印刷
            </Button>
            <Button onClick={handleExport} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              JSON出力
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 印刷用ダイアログ */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            "print-dialog-content",
            /* 画面でも全面白（上下の隙間で背面の最終結果が見えない） */
            "inset-0 top-0 left-0 flex h-[100dvh] max-h-[100dvh] w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-4 sm:p-6 sm:max-w-full",
            "print:overflow-visible print:p-0",
          )}
        >
          <DialogHeader className="print:hidden shrink-0">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setPrintDialogOpen(false)}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <DialogTitle>印刷プレビュー</DialogTitle>
            </div>
          </DialogHeader>
          <div className="print-root min-h-0 flex-1 overflow-y-auto print:block print:min-h-0 print:flex-none print:overflow-visible">
            <PrintScoreSheet />
          </div>
          <div className="flex shrink-0 justify-between gap-2 border-t bg-background pt-4 print:hidden">
            <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              印刷する
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
