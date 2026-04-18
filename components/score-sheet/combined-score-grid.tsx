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

type ScoreEntry = {
  playerNumber: string
  quarter: number
  isThreePointer: boolean
  isFreeThrow: boolean
}

export function CombinedScoreGrid() {
  const { state, getTotalScore, addScore, removeLastScore, toggleQuarterLine, updateScoreEntryPlayer } = useScore()

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addPoint, setAddPoint] = useState<number | null>(null)
  const [addTeam, setAddTeam] = useState<"A" | "B" | null>(null)
  const [addPlayer, setAddPlayer] = useState("")
  const [addPlayerManual, setAddPlayerManual] = useState("")

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editPoint, setEditPoint] = useState<number | null>(null)
  const [editTeam, setEditTeam] = useState<"A" | "B" | null>(null)
  const [editPlayer, setEditPlayer] = useState("")
  const [editPlayerManual, setEditPlayerManual] = useState("")
  const [editIsLast, setEditIsLast] = useState(false)

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
          isFreeThrow: (entry.isFreeThrow ?? false) && i === 0,
        })
      }
    })
    return map
  }

  const scoreMapA = getScoreMap("A")
  const scoreMapB = getScoreMap("B")
  const totalScoreA = getTotalScore("A")
  const totalScoreB = getTotalScore("B")

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

  const handleAddScore = (shotType: "FT" | "2P" | "3P") => {
    const player = resolveAddPlayer()
    if (!player || addPoint === null || !addTeam) return
    const totalScore = addTeam === "A" ? totalScoreA : totalScoreB
    // FT は必ず1点、2P/3P はセルで決まった点数
    const pointsToAdd = shotType === "FT" ? 1 : addPoint - totalScore
    if (pointsToAdd > 0) {
      addScore(
        addTeam,
        player,
        pointsToAdd,
        shotType === "3P",
        shotType === "FT"
      )
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

  // 塗り丸マーカー（背番号入り）
  const CircleMarker = ({ entry }: { entry: ScoreEntry }) => {
    const isRed = entry.quarter === 1 || entry.quarter === 3
    if (entry.isFreeThrow) {
      // FT: 白抜き丸（外枠のみ）
      return (
        <div
          className={cn(
            "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center font-bold leading-none",
            isRed ? "border-red-600 text-red-600" : "border-foreground text-foreground"
          )}
          style={{ fontSize: "6px" }}
        >
          {entry.playerNumber}
        </div>
      )
    }
    if (entry.isThreePointer) {
      // 3P: 塗り丸 + 外リング
      return (
        <div
          className={cn(
            "w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold leading-none ring-2 ring-offset-0",
            isRed ? "bg-red-600 text-white ring-red-300" : "bg-foreground text-white ring-foreground/40"
          )}
          style={{ fontSize: "6px" }}
        >
          {entry.playerNumber}
        </div>
      )
    }
    // 2P: 塗り丸（通常）
    return (
      <div
        className={cn(
          "w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold leading-none",
          isRed ? "bg-red-600 text-white" : "bg-foreground text-white"
        )}
        style={{ fontSize: "6px" }}
      >
        {entry.playerNumber}
      </div>
    )
  }

  // 数字セル（左=Aスラッシュ / 右=Bスラッシュ）
  const renderNumCell = (
    point: number,
    team: "A" | "B",
    scoreMap: Map<number, ScoreEntry>,
    totalScore: number,
    isRightCol: boolean
  ) => {
    const entry = scoreMap.get(point)
    const isScored = !!entry
    const isNext = !isScored && point === totalScore + 1
    const isClickable = isScored || point >= totalScore + 1

    return (
      <div
        className={cn(
          "relative flex items-center justify-center h-full select-none touch-manipulation",
          isClickable ? "cursor-pointer active:brightness-90" : "",
        )}
        style={{ flex: 3 }}
        onClick={() => {
          if (isRightCol) {
            handleCenterTap(point)  // ダブルタップ用（右列）
          }
          if (isClickable) handleTeamClick(point, team)
        }}
      >
        {/* 未得点: 点数テキスト */}
        {!isScored && (
          <span className={cn(
            "font-mono leading-none select-none",
            isNext ? "text-[9px] font-bold text-primary" : "text-[9px] text-foreground/55"
          )}>
            {point}
          </span>
        )}

        {/* 得点済み: 塗り丸マーカー */}
        {isScored && (
          <CircleMarker entry={entry} />
        )}
      </div>
    )
  }

  // 1マクロ列のレンダリング
  // 構成: [A背景(空)] [左数字(A得点)] [右数字(B得点)] [B背景(空)]
  const renderColumn = (points: number[]) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* ヘッダー */}
      <div
        className="border-b-2 border-foreground/50"
        style={{ display: "flex", height: "20px" }}
      >
        <div
          className="flex items-center justify-center text-[9px] font-bold text-primary bg-primary/10"
          style={{ flex: 2 }}
        >
          A
        </div>
        <div
          className="flex items-center justify-center text-[8px] text-muted-foreground border-l border-border/30"
          style={{ flex: 3 }}
        >
          得点
        </div>
        <div
          className="flex items-center justify-center text-[8px] text-muted-foreground border-l border-border/30"
          style={{ flex: 3 }}
        >
          得点
        </div>
        <div
          className="flex items-center justify-center text-[9px] font-bold text-accent bg-accent/10 border-l border-border/30"
          style={{ flex: 2 }}
        >
          B
        </div>
      </div>

      {/* 行 */}
      {points.map((point) => {
        const isQuarterLine = state.quarterLines.includes(point)
        return (
          <div
            key={point}
            className={isQuarterLine ? "border-b-[3px] border-foreground" : "border-b border-border/40"}
            style={{ display: "flex", height: "24px" }}
          >
            {/* A 背景（空） */}
            <div className="bg-primary/5" style={{ flex: 2 }} />

            {/* 左数字列（A が得点 → 塗り丸） */}
            <div className="border-l border-border/30" style={{ flex: 3, position: "relative" }}>
              {renderNumCell(point, "A", scoreMapA, totalScoreA, false)}
            </div>

            {/* 右数字列（B が得点 → 塗り丸）/ ダブルタップでQ区切り */}
            <div className="border-l border-border/30" style={{ flex: 3, position: "relative" }}>
              {renderNumCell(point, "B", scoreMapB, totalScoreB, true)}
            </div>

            {/* B 背景（空） */}
            <div className="bg-accent/5 border-l border-border/30" style={{ flex: 2 }} />
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
        <div style={{ display: "flex", gap: "4px" }}>
          {renderColumn(col1)}
          {renderColumn(col2)}
        </div>

        {/* 凡例 */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-[10px] text-muted-foreground border-t pt-2">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-foreground" />
            <span>= 2P（黒丸）</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-red-600" />
            <span>= 1Q/3Q（赤丸）</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-foreground ring-2 ring-foreground/40" />
            <span>= 3P</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full border-2 border-foreground" />
            <span>= FT</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-4 border-b-[3px] border-foreground" />
            <span>= Q区切り（右列ダブルタップ）</span>
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
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="h-14 flex-col gap-0.5"
                onClick={() => handleAddScore("FT")}
                disabled={!resolveAddPlayer()}
              >
                <span className="text-base font-bold">FT</span>
                <span className="text-[10px] text-muted-foreground">+1点</span>
              </Button>
              <Button
                variant="outline"
                className="h-14 flex-col gap-0.5"
                onClick={() => handleAddScore("2P")}
                disabled={!resolveAddPlayer()}
              >
                <span className="text-base font-bold">2P</span>
                <span className="text-[10px] text-muted-foreground">+2点</span>
              </Button>
              <Button
                variant="outline"
                className="h-14 flex-col gap-0.5 border-2 border-primary"
                onClick={() => handleAddScore("3P")}
                disabled={!resolveAddPlayer()}
              >
                <span className="text-base font-bold">3P</span>
                <span className="text-[10px] text-muted-foreground">+3点</span>
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
