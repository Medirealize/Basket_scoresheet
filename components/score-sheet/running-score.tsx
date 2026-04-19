"use client"

import { useState } from "react"
import { useScore } from "@/lib/score-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Plus, Minus, Undo2 } from "lucide-react"

interface RunningScoreProps {
  team: "A" | "B"
}

export function RunningScore({ team }: RunningScoreProps) {
  const { state, addScore, removeLastScore, getTotalScore, getQuarterScore } = useScore()
  const teamData = team === "A" ? state.teamA : state.teamB
  const [selectedPlayer, setSelectedPlayer] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const activePlayers = teamData.players.filter((p) => p.number && p.isPlaying)
  const allPlayers = teamData.players.filter((p) => p.number)

  const handleAddScore = (points: number) => {
    if (selectedPlayer) {
      // +1 は FT として isFreeThrow を付与（ランニング表で／と塗り丸を区別）
      addScore(team, selectedPlayer, points, points === 3, points === 1)
      setDialogOpen(false)
      setSelectedPlayer("")
    }
  }

  const currentQuarterEntries = state.scoreEntries.filter(
    (e) => e.team === team && e.quarter === state.currentQuarter
  )

  const totalScore = getTotalScore(team)

  // クォーターの色を取得
  const getQuarterColor = (quarter: number) => {
    return quarter === 1 || quarter === 3 ? "text-red-600" : "text-foreground"
  }

  return (
    <Card className={cn(
      "border-l-4",
      team === "A" ? "border-l-primary" : "border-l-accent"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground",
              team === "A" ? "bg-primary" : "bg-accent"
            )}>
              {team}
            </span>
            ランニングスコア
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold font-mono">{totalScore}</span>
            <span className="text-muted-foreground text-sm">点</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* クォーター別スコア */}
        <div className="grid grid-cols-5 gap-2 text-center text-sm">
          {[1, 2, 3, 4, 5].map((q) => (
            <div key={q} className="space-y-1">
              <div className={cn(
                "font-medium",
                getQuarterColor(q)
              )}>
                {q <= 4 ? `${q}Q` : "OT"}
              </div>
              <div className={cn(
                "text-lg font-bold font-mono",
                getQuarterColor(q)
              )}>
                {getQuarterScore(team, q)}
              </div>
            </div>
          ))}
        </div>

        {/* 得点追加ダイアログ */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-14 text-lg" variant={team === "A" ? "default" : "outline"}>
              <Plus className="mr-2 h-5 w-5" />
              得点を追加
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-sm">
            <DialogHeader>
              <DialogTitle className="truncate">得点追加 - {teamData.name || `チーム${team}`}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* 選手選択 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">得点した選手</label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger>
                    <SelectValue placeholder="選手を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {(activePlayers.length > 0 ? activePlayers : allPlayers).map((player) => (
                      <SelectItem key={player.number} value={player.number}>
                        #{player.number} {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 得点ボタン */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className="h-16 text-xl font-bold flex-col gap-0.5"
                  onClick={() => handleAddScore(1)}
                  disabled={!selectedPlayer}
                >
                  <span>+1</span>
                  <span className="text-[10px] text-muted-foreground font-normal">FT</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 text-xl font-bold"
                  onClick={() => handleAddScore(2)}
                  disabled={!selectedPlayer}
                >
                  +2
                </Button>
                <Button
                  variant="outline"
                  className="h-16 text-xl font-bold"
                  onClick={() => handleAddScore(3)}
                  disabled={!selectedPlayer}
                >
                  +3
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 現在のクォーターの得点履歴 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {state.currentQuarter <= 4 ? `第${state.currentQuarter}Q` : "OT"} の得点履歴
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeLastScore(team)}
              disabled={currentQuarterEntries.length === 0}
            >
              <Undo2 className="h-4 w-4 mr-1" />
              取消
            </Button>
          </div>
          <div className="flex flex-wrap gap-1 min-h-[2.5rem] p-2 bg-muted/50 rounded-md">
            {currentQuarterEntries.map((entry, index) => (
              <Badge
                key={entry.timestamp}
                variant="secondary"
                className={cn(
                  "text-xs",
                  state.currentQuarter === 1 || state.currentQuarter === 3
                    ? "bg-red-100 text-red-700"
                    : "bg-secondary"
                )}
              >
                #{entry.playerNumber} +{entry.points} ({entry.totalScore})
              </Badge>
            ))}
            {currentQuarterEntries.length === 0 && (
              <span className="text-xs text-muted-foreground">まだ得点がありません</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
