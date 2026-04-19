"use client"

import { useState } from "react"
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

interface RunningScoreGridProps {
  team: "A" | "B"
}

export function RunningScoreGrid({ team }: RunningScoreGridProps) {
  const { state, getTotalScore, addScore } = useScore()
  const teamData = team === "A" ? state.teamA : state.teamB
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null)
  /** チーム内ロスターインデックス（背番号の重複でも一意） */
  const [selectedRosterIndex, setSelectedRosterIndex] = useState<string>("")

  // 得点履歴から各スコアに対応するエントリを取得
  const scoreEntries = state.scoreEntries.filter((e) => e.team === team)
  
  // 各得点値に対応する記録を作成（1〜160点）
  const scoredPoints = new Map<number, { 
    playerNumber: string
    quarter: number
    isThreePointer: boolean
  }>()
  
  scoreEntries.forEach((entry) => {
    for (let i = 0; i < entry.points; i++) {
      const pointValue = entry.totalScore - (entry.points - 1 - i)
      scoredPoints.set(pointValue, {
        playerNumber: entry.playerNumber,
        quarter: entry.quarter,
        isThreePointer: entry.isThreePointer && i === entry.points - 1,
      })
    }
  })

  const totalScore = getTotalScore(team)
  const activePlayers = teamData.players.filter((p) => p.number && p.isPlaying)

  const selectPlayerOptions = teamData.players
    .map((player, rosterIndex) => ({ player, rosterIndex }))
    .filter(({ player }) => {
      if (!player.number) return false
      if (activePlayers.length > 0) return Boolean(player.isPlaying)
      return true
    })

  // クォーターの色を取得（1Q/3Qは赤、2Q/4Qは黒/青）
  const getQuarterTextColor = (quarter: number) => {
    return quarter === 1 || quarter === 3 ? "text-red-600" : "text-foreground"
  }

  // 次の得点可能な点数を取得
  const nextAvailablePoint = totalScore + 1

  // セルをタップしたときの処理
  const handleCellClick = (point: number) => {
    // 既にスコアされている場合は何もしない
    if (scoredPoints.has(point)) return
    
    // 次の得点可能な点数以降をタップした場合のみダイアログを開く
    if (point >= nextAvailablePoint) {
      setSelectedPoint(point)
      setSelectedRosterIndex("")
      setDialogOpen(true)
    }
  }

  // 得点を追加（通常の2ポイントまたは1ポイント）
  const handleAddScore = (isThreePointer: boolean) => {
    if (selectedRosterIndex === "" || selectedPoint === null) return
    const idx = Number(selectedRosterIndex)
    const player = teamData.players[idx]
    if (!player?.number) return

    // 選択された点までの得点を計算
    const pointsToAdd = selectedPoint - totalScore

    if (pointsToAdd > 0) {
      addScore(team, player.number, pointsToAdd, isThreePointer)
    }

    setDialogOpen(false)
    setSelectedPoint(null)
    setSelectedRosterIndex("")
  }

  // 10点ごとのグリッドを作成（1-10, 11-20, ... 151-160）
  const rows: number[][] = []
  for (let i = 0; i < 160; i += 10) {
    rows.push(Array.from({ length: 10 }, (_, j) => i + j + 1))
  }

  return (
    <Card className={cn(
      "border-l-4",
      team === "A" ? "border-l-primary" : "border-l-accent"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground",
              team === "A" ? "bg-primary" : "bg-accent"
            )}>
              {team}
            </span>
            {teamData.name || `チーム${team}`}
          </CardTitle>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold font-mono">{totalScore}</span>
            <span className="text-muted-foreground text-sm">点</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full border-collapse text-xs">
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((point) => {
                    const entry = scoredPoints.get(point)
                    const isScored = !!entry
                    const isClickable = !isScored && point >= nextAvailablePoint
                    
                    return (
                      <td
                        key={point}
                        onClick={() => handleCellClick(point)}
                        className={cn(
                          "border border-border w-[10%] h-8 text-center relative p-0",
                          "select-none",
                          isClickable && "cursor-pointer hover:bg-muted/50 active:bg-muted"
                        )}
                      >
                        {isScored && entry ? (
                          // 得点済み：スラッシュと背番号
                          <div className={cn(
                            "relative w-full h-full flex items-center justify-center",
                            getQuarterTextColor(entry.quarter)
                          )}>
                            {/* スラッシュ線 */}
                            <svg 
                              className="absolute inset-0 w-full h-full pointer-events-none"
                              viewBox="0 0 100 100"
                              preserveAspectRatio="none"
                            >
                              <line 
                                x1="15" y1="85" x2="85" y2="15" 
                                stroke="currentColor" 
                                strokeWidth="3"
                              />
                            </svg>
                            {/* 3ポイントの場合は丸で囲む */}
                            {entry.isThreePointer ? (
                              <span className={cn(
                                "relative z-10 text-[10px] font-bold leading-none whitespace-nowrap",
                                "border border-current rounded-full inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-0.5",
                                getQuarterTextColor(entry.quarter)
                              )}>
                                {entry.playerNumber}
                              </span>
                            ) : (
                              <span className={cn(
                                "relative z-10 text-[10px] font-bold leading-none whitespace-nowrap",
                                getQuarterTextColor(entry.quarter)
                              )}>
                                {entry.playerNumber}
                              </span>
                            )}
                          </div>
                        ) : (
                          // 未得点：数字のみ
                          <span className={cn(
                            "text-[10px] leading-none",
                            point === nextAvailablePoint 
                              ? "text-primary font-bold" 
                              : "text-muted-foreground"
                          )}>
                            {point}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 凡例 */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 border border-border flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full text-red-600" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="15" y1="85" x2="85" y2="15" stroke="currentColor" strokeWidth="3" />
              </svg>
              <span className="relative text-[8px] font-bold text-red-600">5</span>
            </div>
            <span className="text-muted-foreground">1Q/3Q</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 border border-border flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full text-foreground" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="15" y1="85" x2="85" y2="15" stroke="currentColor" strokeWidth="3" />
              </svg>
              <span className="relative text-[8px] font-bold text-foreground">7</span>
            </div>
            <span className="text-muted-foreground">2Q/4Q</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 border border-border flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full text-red-600" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="15" y1="85" x2="85" y2="15" stroke="currentColor" strokeWidth="3" />
              </svg>
              <span className="relative text-[8px] font-bold text-red-600 border border-red-600 rounded-full w-4 h-4 flex items-center justify-center">5</span>
            </div>
            <span className="text-muted-foreground">3P</span>
          </div>
        </div>
      </CardContent>

      {/* 得点入力ダイアログ */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setSelectedRosterIndex("")
        }}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">
              {selectedPoint}点目を記録
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* 選手選択 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">得点した選手</label>
              <Select value={selectedRosterIndex} onValueChange={setSelectedRosterIndex}>
                <SelectTrigger>
                  <SelectValue placeholder="背番号を選択" />
                </SelectTrigger>
                <SelectContent>
                  {selectPlayerOptions.map(({ player, rosterIndex }) => (
                    <SelectItem key={rosterIndex} value={String(rosterIndex)}>
                      #{player.number} {player.name || "（氏名なし）"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2P / 3P 選択ボタン */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-16 text-lg font-bold"
                onClick={() => handleAddScore(false)}
                disabled={selectedRosterIndex === ""}
              >
                通常
                <span className="text-xs text-muted-foreground ml-1">(FT/2P)</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 text-lg font-bold border-2 border-primary"
                onClick={() => handleAddScore(true)}
                disabled={selectedRosterIndex === ""}
              >
                <span className="border-2 border-current rounded-full px-2 py-1">3P</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
