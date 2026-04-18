"use client"

import { useState, useRef } from "react"
import { useScore } from "@/lib/score-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

type ScoreEntry = { playerNumber: string; quarter: number; isThreePointer: boolean }

export function CombinedScoreGrid() {
  const { state, getTotalScore, addScore, removeLastScore, toggleQuarterLine, updateScoreEntryPlayer } = useScore()

  // 得点追加ダイアログ
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addPoint, setAddPoint] = useState<number | null>(null)
  const [addTeam, setAddTeam] = useState<"A" | "B" | null>(null)
  const [addPlayer, setAddPlayer] = useState("")
  const [addPlayerManual, setAddPlayerManual] = useState("")

  // 選手修正ダイアログ
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editPoint, setEditPoint] = useState<number | null>(null)
  const [editTeam, setEditTeam] = useState<"A" | "B" | null>(null)
  const [editPlayer, setEditPlayer] = useState("")
  const [editPlayerManual, setEditPlayerManual] = useState("")
  const [editIsLast, setEditIsLast] = useState(false)

  // 中央区切りのダブルタップ（Q区切り線）
  const lastCenterTapRef = useRef<Map<number, number>>(new Map())

  const getScoreMap = (team: "A" | "B") => {
    const entries = state.scoreEntries.filter((e) => e.team === team)
    const map = new Map<number, ScoreEntry>()
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

  const getQuarterColor = (quarter: number) =>
    quarter === 1 || quarter === 3 ? "text-red-600" : "text-foreground"

  const getPlayerList = (team: "A" | "B") => {
    const teamData = team === "A" ? state.teamA : state.teamB
    const active = teamData.players.filter((p) => p.number && p.isPlaying)
    const all = teamData.players.filter((p) => p.number)
    return active.length > 0 ? active : all
  }

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

  const handleTeamClick = (point: number, team: "A" | "B") => {
    const totalScore = team === "A" ? totalScoreA : totalScoreB
    const scoreMap = team === "A" ? scoreMapA : scoreMapB

    if (scoreMap.has(point)) {
      const entry = scoreMap.get(point)!
      setEditPoint(point)
      setEditTeam(team)
      setEditPlayer(entry.playerNumber)
      setEditPlayerManual(entry.playerNumber)
      setEditIsLast(point === totalScore)
      setEditDialogOpen(true)
    } else if (point >= totalScore + 1) {
      setAddPoint(point)
      setAddTeam(team)
      setAddPlayer("")
      setAddPlayerManual("")
      setAddDialogOpen(true)
    }
  }

  const resolveAddPlayer = () => addPlayer || addPlayerManual.trim()
  const resolveEditPlayer = () => editPlayer || editPlayerManual.trim()

  const handleAddScore = (isThreePointer: boolean) => {
    const player = resolveAddPlayer()
    if (!player || addPoint === null || !addTeam) return
    const totalScore = addTeam === "A" ? totalScoreA : totalScoreB
    const pointsToAdd = addPoint - totalScore
    if (pointsToAdd > 0) {
      addScore(addTeam, player, pointsToAdd, isThreePointer)
    }
    setAddDialogOpen(false)
    setAddPoint(null)
    setAddTeam(null)
    setAddPlayer("")
    setAddPlayerManual("")
  }

  const handleEditConfirm = () => {
    const player = resolveEditPlayer()
    if (!player || editPoint === null || !editTeam) return
    updateScoreEntryPlayer(editTeam, editPoint, player)
    setEditDialogOpen(false)
  }

  const handleDeleteScore = () => {
    if (editTeam) removeLastScore(editTeam)
    setEditDialogOpen(false)
  }

  // 数字セル（左スラッシュ付き）
  const renderNumCell = (
    point: number,
    team: "A" | "B",
    scoreMap: Map<number, ScoreEntry>,
    totalScore: number
  ) => {
    const entry = scoreMap.get(point)
    const isScored = !!entry
    const isNext = !isScored && point === totalScore + 1
    const isClickable = isScored || point >= totalScore + 1
    const qColor = entry ? getQuarterColor(entry.quarter) : ""

    return (
      <div
        className={cn(
          "relative flex items-center justify-center h-full overflow-hidden select-none touch-manipulation",
          isClickable ? "cursor-pointer active:brightness-90" : "",
        )}
        onClick={() => isClickable && handleTeamClick(point, team)}
      >
        {/* 点数 */}
        <span className={cn(
          "font-mono leading-none z-10 select-none",
          isScored
            ? "text-[8px] text-muted-foreground/20"
            : isNext
              ? "text-[9px] font-bold text-primary"
              : "text-[9px] text-foreground/60"
        )}>
          {point}
        </span>

        {/* 左スラッシュ "/" */}
        {isScored && (
          <svg
            className={cn("absolute inset-0 w-full h-full pointer-events-none", qColor)}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <line x1="10" y1="90" x2="90" y2="10" stroke="currentColor" strokeWidth="10" />
          </svg>
        )}
      </div>
    )
  }

  // 背番号セル（A/B の外側列）
  const renderPlayerCell = (
    point: number,
    team: "A" | "B",
    scoreMap: Map<number, ScoreEntry>,
    totalScore: number
  ) => {
    const entry = scoreMap.get(point)
    const isScored = !!entry
    const isClickable = isScored || point >= totalScore + 1
    const qColor = entry ? getQuarterColor(entry.quarter) : ""

    return (
      <div
        className={cn(
          "flex items-center justify-center h-full select-none touch-manipulation overflow-hidden",
          team === "A" ? "bg-primary/10" : "bg-accent/10",
          isClickable ? "cursor-pointer active:brightness-90" : "",
        )}
        onClick={() => isClickable && handleTeamClick(point, team)}
      >
        {isScored && (
          <span
            className={cn("font-bold leading-none select-none", qColor)}
            style={{ fontSize: "7px" }}
          >
            {entry!.isThreePointer ? (
              <span
                className="border border-current rounded-full inline-flex items-center justify-center leading-none"
                style={{ fontSize: "6px", minWidth: "10px", height: "10px", padding: "0 1px" }}
              >
                {entry!.playerNumber}
              </span>
            ) : entry!.playerNumber}
          </span>
        )}
      </div>
    )
  }

  // 1マクロ列のレンダリング
  // 構成: [A背番号] [左数字（Aスラッシュ）] [右数字（Bスラッシュ）] [B背番号]
  const renderColumn = (points: number[]) => (
    <div className="flex-1 min-w-0">
      {/* ヘッダー */}
      <div className="grid grid-cols-[2fr_4fr_4fr_2fr] text-[8px] font-bold border-b-2 border-foreground/50 h-5">
        <div className="flex items-center justify-center bg-primary/10 text-primary">A</div>
        <div className="flex items-center justify-center border-l border-border/30 text-muted-foreground">数</div>
        <div className="flex items-center justify-center border-l border-border/30 text-muted-foreground">数</div>
        <div className="flex items-center justify-center border-l border-border/30 bg-accent/10 text-accent">B</div>
      </div>

      {/* 行 */}
      {points.map((point) => {
        const isQuarterLine = state.quarterLines.includes(point)
        return (
          <div
            key={point}
            className={cn(
              "grid grid-cols-[2fr_4fr_4fr_2fr] h-6",
              isQuarterLine
                ? "border-b-[3px] border-foreground"
                : "border-b border-border/40"
            )}
          >
            {/* A 背番号列 */}
            {renderPlayerCell(point, "A", scoreMapA, totalScoreA)}

            {/* 左数字列（A がスラッシュ） */}
            <div className="border-l border-border/30">
              {renderNumCell(point, "A", scoreMapA, totalScoreA)}
            </div>

            {/* 右数字列（B がスラッシュ）・ダブルタップでQ区切り */}
            <div
              className="border-l border-border/30"
              onClick={() => handleCenterTap(point)}
            >
              {renderNumCell(point, "B", scoreMapB, totalScoreB)}
            </div>

            {/* B 背番号列 */}
            <div className="border-l border-border/30">
              {renderPlayerCell(point, "B", scoreMapB, totalScoreB)}
            </div>
          </div>
        )
      })}
    </div>
  )

  const col1 = Array.from({ length: 80 }, (_, i) => i + 1)
  const col2 = Array.from({ length: 80 }, (_, i) => i + 81)
  const addPlayerList = addTeam ? getPlayerList(addTeam) : []
  const editPlayerList = editTeam ? getPlayerList(editTeam) : []

  const PlayerSelectUI = ({
    playerList,
    selected,
    onSelect,
    manual,
    onManual,
  }: {
    playerList: { number: string; name: string }[]
    selected: string
    onSelect: (v: string) => void
    manual: string
    onManual: (v: string) => void
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">得点した選手</label>
      {playerList.length > 0 ? (
        <Select value={selected} onValueChange={onSelect}>
          <SelectTrigger>
            <SelectValue placeholder="背番号を選択" />
          </SelectTrigger>
          <SelectContent>
            {playerList.map((p) => (
              <SelectItem key={p.number} value={p.number}>
                #{p.number} {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          placeholder="背番号を入力（例：5）"
          value={manual}
          onChange={(e) => onManual(e.target.value)}
          inputMode="numeric"
        />
      )}
    </div>
  )

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
        <div className="flex gap-1">
          {renderColumn(col1)}
          {renderColumn(col2)}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-[10px] text-muted-foreground border-t pt-2">
          <div className="flex items-center gap-1">
            <span className="text-red-600 font-bold">赤</span><span>= 1Q/3Q</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-foreground font-bold">黒</span><span>= 2Q/4Q</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="border border-current rounded-full inline-flex items-center justify-center w-4 h-4 text-[8px] font-bold">5</span>
            <span>= 3P</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-4 border-b-[3px] border-foreground" />
            <span>= Q区切り（右数字列ダブルタップ）</span>
          </div>
        </div>
      </CardContent>

      {/* 得点追加ダイアログ */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">
              <span className={cn("inline-flex items-center gap-1.5", addTeam === "A" ? "text-primary" : "text-accent")}>
                <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white", addTeam === "A" ? "bg-primary" : "bg-accent")}>
                  {addTeam}
                </span>
                {addTeam === "A" ? state.teamA.name || "チームA" : state.teamB.name || "チームB"}
              </span>
              <br />
              <span className="text-base font-bold">{addPoint}点目を記録</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <PlayerSelectUI
              playerList={addPlayerList}
              selected={addPlayer}
              onSelect={setAddPlayer}
              manual={addPlayerManual}
              onManual={setAddPlayerManual}
            />
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-14 text-base font-bold"
                onClick={() => handleAddScore(false)}
                disabled={!resolveAddPlayer()}
              >
                通常<span className="text-[10px] text-muted-foreground ml-1">(FT/2P)</span>
              </Button>
              <Button
                variant="outline"
                className="h-14 text-base font-bold border-2 border-primary"
                onClick={() => handleAddScore(true)}
                disabled={!resolveAddPlayer()}
              >
                <span className="border-2 border-current rounded-full px-2 py-0.5">3P</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 選手修正ダイアログ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">
              <span className={cn("inline-flex items-center gap-1.5", editTeam === "A" ? "text-primary" : "text-accent")}>
                <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white", editTeam === "A" ? "bg-primary" : "bg-accent")}>
                  {editTeam}
                </span>
                {editPoint}点目の背番号修正
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <PlayerSelectUI
              playerList={editPlayerList}
              selected={editPlayer}
              onSelect={setEditPlayer}
              manual={editPlayerManual}
              onManual={setEditPlayerManual}
            />
            <div className={cn("grid gap-3", editIsLast ? "grid-cols-3" : "grid-cols-1")}>
              {editIsLast && (
                <Button variant="destructive" className="h-12" onClick={handleDeleteScore}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="default"
                className={cn("h-12", editIsLast ? "col-span-2" : "")}
                onClick={handleEditConfirm}
                disabled={!resolveEditPlayer()}
              >
                修正する
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
