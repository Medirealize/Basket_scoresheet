"use client"

import { useState, useRef } from "react"
import { useScore } from "@/lib/score-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Trash2 } from "lucide-react"

export function CombinedScoreGrid() {
  const { state, getTotalScore, addScore, removeLastScore, toggleQuarterLine } = useScore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<"A" | "B" | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<string>("")

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTeam, setDeleteTeam] = useState<"A" | "B" | null>(null)
  const [deletePoint, setDeletePoint] = useState<number | null>(null)

  // 中央セルのダブルタップ検出（Q区切り線）
  const lastCenterTapRef = useRef<Map<number, number>>(new Map())

  // 各チームの得点マップを構築
  const getScoreMap = (team: "A" | "B") => {
    const entries = state.scoreEntries.filter((e) => e.team === team)
    const map = new Map<number, { playerNumber: string; quarter: number; isThreePointer: boolean }>()
    entries.forEach((entry) => {
      for (let i = 0; i < entry.points; i++) {
        const pointValue = entry.totalScore - (entry.points - 1 - i)
        map.set(pointValue, {
          playerNumber: entry.playerNumber,
          quarter: entry.quarter,
          isThreePointer: entry.isThreePointer && i === entry.points - 1,
        })
      }
    })
    return map
  }

  const scoreMapA = getScoreMap("A")
  const scoreMapB = getScoreMap("B")
  const totalScoreA = getTotalScore("A")
  const totalScoreB = getTotalScore("B")

  // クォーターの色
  const getQuarterTextColor = (quarter: number) =>
    quarter === 1 || quarter === 3 ? "text-red-600" : "text-foreground"

  // 選手リストを取得
  const getPlayerList = (team: "A" | "B") => {
    const teamData = team === "A" ? state.teamA : state.teamB
    const active = teamData.players.filter((p) => p.number && p.isPlaying)
    const all = teamData.players.filter((p) => p.number)
    return active.length > 0 ? active : all
  }

  // --- クリックハンドラ ---

  // A/B 側セルのシングルクリック（得点追加 or 最終得点削除）
  const handleSideClick = (point: number, team: "A" | "B") => {
    const totalScore = team === "A" ? totalScoreA : totalScoreB
    const scoreMap = team === "A" ? scoreMapA : scoreMapB

    if (scoreMap.has(point)) {
      // 最終得点のセルのみ削除ダイアログを開く
      if (point === totalScore) {
        setDeleteTeam(team)
        setDeletePoint(point)
        setDeleteDialogOpen(true)
      }
    } else if (point >= totalScore + 1) {
      // 未得点かつ次以降 → 得点入力ダイアログ
      setSelectedPoint(point)
      setSelectedTeam(team)
      setSelectedPlayer("")
      setDialogOpen(true)
    }
  }

  // 中央セルのタップ（ダブルタップでQ区切り線トグル）
  const handleCenterTap = (point: number) => {
    const now = Date.now()
    const last = lastCenterTapRef.current.get(point) ?? 0
    if (now - last < 300) {
      lastCenterTapRef.current.delete(point)
      toggleQuarterLine(point)
    } else {
      lastCenterTapRef.current.set(point, now)
    }
  }

  // 得点を追加
  const handleAddScore = (isThreePointer: boolean) => {
    if (!selectedPlayer || selectedPoint === null || !selectedTeam) return
    const totalScore = selectedTeam === "A" ? totalScoreA : totalScoreB
    const pointsToAdd = selectedPoint - totalScore
    if (pointsToAdd > 0) {
      addScore(selectedTeam, selectedPlayer, pointsToAdd, isThreePointer)
    }
    setDialogOpen(false)
    setSelectedPoint(null)
    setSelectedTeam(null)
    setSelectedPlayer("")
  }

  // 得点を削除
  const handleDeleteScore = () => {
    if (deleteTeam) removeLastScore(deleteTeam)
    setDeleteDialogOpen(false)
    setDeleteTeam(null)
    setDeletePoint(null)
  }

  // --- レンダラ ---

  const renderPlayerNumber = (
    entry: { playerNumber: string; quarter: number; isThreePointer: boolean } | undefined
  ) => {
    if (!entry) return <span className="text-transparent select-none">-</span>
    return (
      <span className={cn("text-[10px] font-bold whitespace-nowrap leading-none", getQuarterTextColor(entry.quarter))}>
        {entry.isThreePointer ? (
          <span className="border border-current rounded-full inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-0.5 leading-none">
            {entry.playerNumber}
          </span>
        ) : (
          entry.playerNumber
        )}
      </span>
    )
  }

  const renderScoreCell = (
    point: number,
    entryA: { playerNumber: string; quarter: number; isThreePointer: boolean } | undefined,
    entryB: { playerNumber: string; quarter: number; isThreePointer: boolean } | undefined
  ) => {
    const isScoredA = !!entryA
    const isScoredB = !!entryB

    if (!isScoredA && !isScoredB) {
      const isNextA = point === totalScoreA + 1
      const isNextB = point === totalScoreB + 1
      return (
        <span className={cn(
          "text-[9px] leading-none",
          isNextA || isNextB ? "text-primary font-bold" : "text-muted-foreground/60"
        )}>
          {point}
        </span>
      )
    }

    return (
      <div className="w-full h-full flex items-center justify-center relative">
        {isScoredA && (
          <svg
            className={cn("absolute inset-0 w-full h-full pointer-events-none", getQuarterTextColor(entryA.quarter))}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <line x1="20" y1="80" x2="80" y2="20" stroke="currentColor" strokeWidth="5" />
          </svg>
        )}
        {isScoredB && (
          <svg
            className={cn("absolute inset-0 w-full h-full pointer-events-none", getQuarterTextColor(entryB.quarter))}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="5" />
          </svg>
        )}
        <span className="relative z-10 text-[9px] text-muted-foreground/40 leading-none">{point}</span>
      </div>
    )
  }

  // 1列分のレンダリング（points: 表示する点数の配列）
  const renderColumn = (points: number[]) => (
    <div className="flex-1 min-w-0">
      {/* ヘッダー */}
      <div className="grid grid-cols-3 text-[8px] font-bold border-b-2 border-foreground/50 mb-0">
        <div className="text-center text-primary py-0.5 truncate">A</div>
        <div className="text-center text-muted-foreground py-0.5">点</div>
        <div className="text-center text-accent py-0.5 truncate">B</div>
      </div>

      {points.map((point) => {
        const entryA = scoreMapA.get(point)
        const entryB = scoreMapB.get(point)
        const isScoredA = !!entryA
        const isScoredB = !!entryB
        const isQuarterLine = state.quarterLines.includes(point)

        return (
          <div
            key={point}
            className={cn(
              "grid grid-cols-3 h-6",
              isQuarterLine
                ? "border-b-[3px] border-foreground"
                : "border-b border-border/40"
            )}
          >
            {/* A チーム 背番号 */}
            <div
              className={cn(
                "flex items-center justify-center bg-primary/5 select-none",
                !isScoredA && point >= totalScoreA + 1
                  ? "cursor-pointer active:bg-primary/20"
                  : isScoredA && point === totalScoreA
                    ? "cursor-pointer active:bg-red-100"
                    : ""
              )}
              onClick={() => handleSideClick(point, "A")}
            >
              {renderPlayerNumber(entryA)}
            </div>

            {/* 中央 点数（ダブルタップでQ区切り線） */}
            <div
              className={cn(
                "flex items-center justify-center border-x border-border/20 cursor-pointer select-none touch-manipulation",
                isQuarterLine && "bg-foreground/5"
              )}
              onClick={() => handleCenterTap(point)}
            >
              {renderScoreCell(point, entryA, entryB)}
            </div>

            {/* B チーム 背番号 */}
            <div
              className={cn(
                "flex items-center justify-center bg-accent/5 select-none",
                !isScoredB && point >= totalScoreB + 1
                  ? "cursor-pointer active:bg-accent/20"
                  : isScoredB && point === totalScoreB
                    ? "cursor-pointer active:bg-red-100"
                    : ""
              )}
              onClick={() => handleSideClick(point, "B")}
            >
              {renderPlayerNumber(entryB)}
            </div>
          </div>
        )
      })}
    </div>
  )

  const col1 = Array.from({ length: 80 }, (_, i) => i + 1)
  const col2 = Array.from({ length: 80 }, (_, i) => i + 81)
  const playerListForDialog = selectedTeam ? getPlayerList(selectedTeam) : []

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-center">ランニングスコア</CardTitle>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">A</span>
            <span className="font-medium text-sm truncate max-w-[6rem]">{state.teamA.name || "チームA"}</span>
            <span className="text-xl font-bold font-mono">{totalScoreA}</span>
          </div>
          <div className="text-lg text-muted-foreground font-bold">-</div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold font-mono">{totalScoreB}</span>
            <span className="font-medium text-sm truncate max-w-[6rem] text-right">{state.teamB.name || "チームB"}</span>
            <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground shrink-0">B</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 pb-3">
        {/* 2列グリッド */}
        <div className="flex gap-1">
          {renderColumn(col1)}
          {renderColumn(col2)}
        </div>

        {/* 凡例 */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-[10px] text-muted-foreground border-t pt-2">
          <div className="flex items-center gap-1">
            <span className="text-red-600 font-bold">赤</span>
            <span>= 1Q/3Q</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-foreground font-bold">黒</span>
            <span>= 2Q/4Q</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="border border-current rounded-full inline-flex items-center justify-center w-4 h-4 text-[8px] font-bold">5</span>
            <span>= 3P</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-4 border-b-[3px] border-foreground" />
            <span>= Q区切り（点数部分をダブルタップ）</span>
          </div>
        </div>
      </CardContent>

      {/* 得点入力ダイアログ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">
              <span className={cn(
                "inline-flex items-center gap-1.5",
                selectedTeam === "A" ? "text-primary" : "text-accent"
              )}>
                <span className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white",
                  selectedTeam === "A" ? "bg-primary" : "bg-accent"
                )}>
                  {selectedTeam}
                </span>
                {selectedTeam === "A" ? state.teamA.name || "チームA" : state.teamB.name || "チームB"}
              </span>
              <br />
              <span className="text-base font-bold">{selectedPoint}点目を記録</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">得点した選手</label>
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger>
                  <SelectValue placeholder="背番号を選択" />
                </SelectTrigger>
                <SelectContent>
                  {playerListForDialog.map((player) => (
                    <SelectItem key={player.number} value={player.number}>
                      #{player.number} {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-14 text-base font-bold"
                onClick={() => handleAddScore(false)}
                disabled={!selectedPlayer}
              >
                通常
                <span className="text-[10px] text-muted-foreground ml-1">(FT/2P)</span>
              </Button>
              <Button
                variant="outline"
                className="h-14 text-base font-bold border-2 border-primary"
                onClick={() => handleAddScore(true)}
                disabled={!selectedPlayer}
              >
                <span className="border-2 border-current rounded-full px-2 py-0.5">3P</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">
              <Trash2 className="w-7 h-7 mx-auto mb-1 text-destructive" />
              得点を取り消しますか？
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <p className="text-center text-sm text-muted-foreground">
              {deleteTeam === "A" ? state.teamA.name || "チームA" : state.teamB.name || "チームB"} の
              最後の得点（{deletePoint}点目）を取り消します。
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                キャンセル
              </Button>
              <Button variant="destructive" onClick={handleDeleteScore}>
                取り消す
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
