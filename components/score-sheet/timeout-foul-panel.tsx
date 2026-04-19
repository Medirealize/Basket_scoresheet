"use client"

import { useState } from "react"
import { useScore, type TimeoutRecord } from "@/lib/score-context"
import { formatElapsedMinutesForTimeoutCell, normalizeQuarterMinutes } from "@/lib/timeout-sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface TimeoutFoulPanelProps {
  team: "A" | "B"
}

export function TimeoutFoulPanel({ team }: TimeoutFoulPanelProps) {
  const { state, useTimeout, cancelTimeout } = useScore()
  const teamData = team === "A" ? state.teamA : state.teamB
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedHalf, setSelectedHalf] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedQuarter, setSelectedQuarter] = useState(1)
  const [remainingSec30, setRemainingSec30] = useState<0 | 30>(0)

  const quarterMinutes = normalizeQuarterMinutes(state.gameInfo.quarterMinutes)

  // セルの位置からクォーター番号を取得
  // half=0: 前半 (index 0=1Q, index 1=2Q)
  // half=1: 後半 (index 0=3Q, index 1,2=4Q)
  // half=2: OT (index 0=5)
  const getQuarterFromCell = (half: number, index: number): number => {
    if (half === 0) {
      return index === 0 ? 1 : 2 // 1Q, 2Q
    } else if (half === 1) {
      return index === 0 ? 3 : 4 // 3Q, 4Q, 4Q
    } else {
      return 5 // OT
    }
  }

  const handleTimeoutClick = (half: number, index: number, record: TimeoutRecord) => {
    const quarter = getQuarterFromCell(half, index)
    if (record.used || record.cancelled) {
      if (record.used) {
        useTimeout(team, half, index, "", quarter)
      } else {
        cancelTimeout(team, half, index)
      }
    } else {
      setSelectedHalf(half)
      setSelectedIndex(index)
      setSelectedQuarter(quarter)
      setRemainingSec30(0)
      setDialogOpen(true)
    }
  }

  const handleSelectRemainingMinutes = (remainingMin: number) => {
    const sec: 0 | 30 = remainingMin >= quarterMinutes ? 0 : remainingSec30
    const elapsedCell = formatElapsedMinutesForTimeoutCell(quarterMinutes, remainingMin, sec)
    useTimeout(team, selectedHalf, selectedIndex, elapsedCell, selectedQuarter)
    setDialogOpen(false)
  }

  const handleMarkUnused = () => {
    cancelTimeout(team, selectedHalf, selectedIndex)
    setDialogOpen(false)
  }

  const getQuarterLabel = () => {
    if (selectedQuarter === 5) return "OT"
    return `${selectedQuarter}Q`
  }

  const getRemainingMinuteOptions = (): number[] => {
    const out: number[] = []
    for (let r = quarterMinutes; r >= 0; r--) out.push(r)
    return out
  }

  // 1Q, 3Qは赤字、2Q, 4Qは黒字
  const getQuarterTextColor = (quarter: number) => {
    if (quarter === 1 || quarter === 3) return "text-red-600"
    return "text-foreground"
  }

  const renderCell = (record: TimeoutRecord, half: number, index: number) => {
    const quarter = getQuarterFromCell(half, index)
    return (
      <button
        key={`${half}-${index}`}
        className={cn(
          "w-12 h-10 border border-foreground/30 text-sm font-mono flex items-center justify-center",
          "hover:bg-muted/50 active:bg-muted transition-colors",
          record.used && "bg-primary/10",
          record.cancelled && "bg-muted"
        )}
        onClick={() => handleTimeoutClick(half, index, record)}
      >
        {record.cancelled ? (
          <span className="line-through decoration-2 decoration-double text-muted-foreground">-</span>
        ) : record.used ? (
          <span className={cn("font-bold", getQuarterTextColor(record.quarter))}>{record.time}</span>
        ) : (
          <span className="text-muted-foreground/30">-</span>
        )}
      </button>
    )
  }

  return (
    <>
      <Card className={cn(
        "border-l-4",
        team === "A" ? "border-l-primary" : "border-l-accent"
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground",
              team === "A" ? "bg-primary" : "bg-accent"
            )}>
              {team}
            </span>
            タイムアウト - {teamData.name || `チーム${team}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* タイムアウト グリッド - 左上=1Q, 右上=2Q, 左下=3Q, 右下2つ=4Q */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-4">
              <div className="text-sm font-medium text-muted-foreground leading-tight shrink-0 pt-2">
                Time<br />outs
              </div>
              <div className="flex flex-col">
                {/* 上段: 1Q (左), 2Q (右) */}
                <div className="flex">
                  {teamData.timeouts[0].map((record, index) => 
                    renderCell(record, 0, index)
                  )}
                </div>
                {/* 下段: 3Q (左), 4Q (中・右) */}
                <div className="flex">
                  {teamData.timeouts[1].map((record, index) => 
                    renderCell(record, 1, index)
                  )}
                </div>
              </div>
            </div>

            {/* Overtimes */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t">
              <div className="text-sm font-medium text-muted-foreground shrink-0">
                Overtimes
              </div>
              <div className="flex">
                {teamData.timeouts[2].map((record, index) => 
                  renderCell(record, 2, index)
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            1ピリオド {quarterMinutes} 分（試合情報で変更）| 記入は経過分 | 左上=1Q(赤), 右上=2Q(黒), 左下=3Q(赤), 右下2つ=4Q(黒)
          </p>
        </CardContent>
      </Card>

      {/* 時間選択ダイアログ */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (open) setRemainingSec30(0)
          setDialogOpen(open)
        }}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">
              タイムアウト記録
              <span className={cn("ml-2", getQuarterTextColor(selectedQuarter))}>
                ({getQuarterLabel()})
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-center text-sm text-muted-foreground">
              {teamData.name || `チーム${team}`}
            </p>
            <p className="text-center text-xs text-muted-foreground leading-snug">
              1ピリオド {quarterMinutes} 分のとき、<strong>コロ上の残り</strong>を選びます。
              <br />
              枠には<strong>経過分数</strong>（例: 残り4:00→「6」）が入ります。
            </p>

            <div className="flex justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={remainingSec30 === 0 ? "default" : "outline"}
                className="h-8 px-3"
                onClick={() => setRemainingSec30(0)}
              >
                残り秒 0
              </Button>
              <Button
                type="button"
                size="sm"
                variant={remainingSec30 === 30 ? "default" : "outline"}
                className="h-8 px-3"
                onClick={() => setRemainingSec30(30)}
              >
                ＋30秒
              </Button>
            </div>

            <div className="space-y-2">
              <label className="block text-center text-sm font-medium">残り分数</label>
              <div className="grid max-h-[220px] grid-cols-4 gap-1.5 overflow-y-auto pr-1">
                {getRemainingMinuteOptions().map((r) => (
                  <Button
                    key={r}
                    type="button"
                    variant="outline"
                    className={cn("h-9 font-mono text-sm", getQuarterTextColor(selectedQuarter))}
                    onClick={() => handleSelectRemainingMinutes(r)}
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDialogOpen(false)}
              >
                キャンセル
              </Button>
            </div>
            
            <div className="border-t pt-3">
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground"
                onClick={handleMarkUnused}
              >
                <span className="line-through decoration-2 decoration-double mr-2">TO</span>
                未使用にする（二重線）
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
