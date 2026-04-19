"use client"

import { useState } from "react"
import { useScore, type TimeoutRecord } from "@/lib/score-context"
import { formatElapsedMinutesForTimeoutCell, normalizeQuarterMinutes } from "@/lib/timeout-sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export function TimeoutBar() {
  const { state, useTimeout, cancelTimeout } = useScore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<"A" | "B">("A")
  const [selectedHalf, setSelectedHalf] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedQuarter, setSelectedQuarter] = useState(1)
  const [remainingSec30, setRemainingSec30] = useState<0 | 30>(0)

  const quarterMinutes = normalizeQuarterMinutes(state.gameInfo.quarterMinutes)

  const handleTimeoutClick = (team: "A" | "B", half: number, index: number, record: TimeoutRecord, quarter: number) => {
    if (record.used || record.cancelled) {
      // 使用済み or キャンセル済みの場合は取り消し
      if (record.used) {
        useTimeout(team, half, index, "", quarter)
      } else {
        cancelTimeout(team, half, index)
      }
    } else {
      // 新規記録の場合は時間入力ダイアログ
      setSelectedTeam(team)
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
    useTimeout(selectedTeam, selectedHalf, selectedIndex, elapsedCell, selectedQuarter)
    setDialogOpen(false)
  }

  const handleMarkUnused = () => {
    cancelTimeout(selectedTeam, selectedHalf, selectedIndex)
    setDialogOpen(false)
  }

  const getQuarterLabel = () => {
    if (selectedQuarter === 5) return "OT"
    return `${selectedQuarter}Q`
  }

  /** コロ上の「残り分数」（0 = 終了直前） */
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

  const renderTeamTimeouts = (team: "A" | "B") => {
    const teamData = team === "A" ? state.teamA : state.teamB
    const teamName = teamData.name || `チーム${team}`

    const renderCell = (record: TimeoutRecord, half: number, index: number, quarter: number) => {
      return (
        <button
          key={`${half}-${index}`}
          className={cn(
            "w-7 h-6 border border-foreground/30 text-xs font-mono flex items-center justify-center",
            "hover:bg-muted/50 active:bg-muted transition-colors",
            record.used && "bg-primary/10",
            record.cancelled && "bg-muted"
          )}
          onClick={() => handleTimeoutClick(team, half, index, record, quarter)}
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
      <div className={cn(
        "flex-1 p-1.5 rounded border",
        team === "A" ? "border-primary/30" : "border-accent/30"
      )}>
        <div className={cn(
          "text-[10px] font-bold mb-1 truncate",
          team === "A" ? "text-primary" : "text-accent"
        )}>
          {teamName}
        </div>
        
        {/* Time outs グリッド - 画像の形式: 左上=1Q, 右上=2Q, 左下=3Q, 右下2つ=4Q */}
        <div className="flex items-start gap-0.5">
          <div className="text-[8px] text-muted-foreground leading-tight w-8 shrink-0">
            Time<br />outs
          </div>
          <div className="flex flex-col">
            {/* 上段: 1Q (左), 2Q (右) */}
            <div className="flex">
              {renderCell(teamData.timeouts[0][0], 0, 0, 1)}
              {renderCell(teamData.timeouts[0][1], 0, 1, 2)}
            </div>
            {/* 下段: 3Q (左), 4Q (中・右) */}
            <div className="flex">
              {renderCell(teamData.timeouts[1][0], 1, 0, 3)}
              {renderCell(teamData.timeouts[1][1], 1, 1, 4)}
              {renderCell(teamData.timeouts[1][2], 1, 2, 4)}
            </div>
          </div>
        </div>

        {/* Overtimes */}
        <div className="flex items-center gap-0.5 mt-1 border-t border-foreground/10 pt-1">
          <div className="text-[8px] text-muted-foreground w-8 shrink-0">
            OT
          </div>
          <div className="flex">
            {renderCell(teamData.timeouts[2][0], 2, 0, 5)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Card className="bg-card/80">
        <CardContent className="p-2">
          <div className="flex gap-2">
            {renderTeamTimeouts("A")}
            {renderTeamTimeouts("B")}
          </div>
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
              {selectedTeam === "A" ? state.teamA.name || "チームA" : state.teamB.name || "チームB"}
            </p>
            <p className="text-center text-xs text-muted-foreground leading-snug">
              1ピリオド {quarterMinutes} 分のとき、<strong>コロ上の残り時間</strong>を選びます。
              <br />
              枠には<strong>経過した分数</strong>（例: 残り4:00→「6」）が入ります。
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
              <label className="block text-center text-sm font-medium">
                残り分数（残り{quarterMinutes}:00 から 0:00）
              </label>
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
