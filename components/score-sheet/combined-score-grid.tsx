"use client"

import { useMemo, useState, useRef } from "react"
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
import {
  RUNNING_SCORE_TEAM_B_BG,
  getRunningCellMeta,
  lastRunningScoreByQuarter,
  quarterSeparatorBottomClassScreen,
  quarterSeparatorLineStylesForTeam,
} from "@/lib/running-score-helpers"
import { Trash2 } from "lucide-react"

type CellMeta = NonNullable<ReturnType<typeof getRunningCellMeta>>

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

  const scoreMapA = useMemo(() => {
    const m = new Map<number, CellMeta>()
    for (let p = 1; p <= 120; p++) {
      const c = getRunningCellMeta(state.scoreEntries, "A", p)
      if (c) m.set(p, c)
    }
    return m
  }, [state.scoreEntries])
  const scoreMapB = useMemo(() => {
    const m = new Map<number, CellMeta>()
    for (let p = 1; p <= 120; p++) {
      const c = getRunningCellMeta(state.scoreEntries, "B", p)
      if (c) m.set(p, c)
    }
    return m
  }, [state.scoreEntries])
  const lastByQ_A = useMemo(() => lastRunningScoreByQuarter(state.scoreEntries, "A"), [state.scoreEntries])
  const lastByQ_B = useMemo(() => lastRunningScoreByQuarter(state.scoreEntries, "B"), [state.scoreEntries])

  const totalScoreA = getTotalScore("A")
  const totalScoreB = getTotalScore("B")
  const gameEnded = Boolean(state.winner)

  const quarterLineStylesA = useMemo(
    () => quarterSeparatorLineStylesForTeam(state.scoreEntries, "A", state.quarterLines),
    [state.scoreEntries, state.quarterLines]
  )
  const quarterLineStylesB = useMemo(
    () => quarterSeparatorLineStylesForTeam(state.scoreEntries, "B", state.quarterLines),
    [state.scoreEntries, state.quarterLines]
  )

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
    const m0 = scoreMap.get(point)
    if (m0?.hideJerseyAndScore) return

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
    const pointsToAdd = shotType === "FT" ? 1 : addPoint - totalScore
    if (pointsToAdd > 0) {
      addScore(addTeam, player, pointsToAdd, shotType === "3P", shotType === "FT")
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

  const inkClass = (quarter: number) =>
    quarter === 1 || quarter === 3 ? "text-red-600" : "text-neutral-900"

  const quarterEndPointsA = useMemo(() => new Set(lastByQ_A.values()), [lastByQ_A])
  const quarterEndPointsB = useMemo(() => new Set(lastByQ_B.values()), [lastByQ_B])
  const isQuarterEndScore = (team: "A" | "B", point: number) =>
    team === "A" ? quarterEndPointsA.has(point) : quarterEndPointsB.has(point)

  const teamGameEndRow = (team: "A" | "B", point: number) =>
    gameEnded && point === (team === "A" ? totalScoreA : totalScoreB) && (totalScoreA > 0 || totalScoreB > 0)

  const RunningScoreDigit = ({
    point,
    meta,
    isQuarterEnd,
  }: {
    point: number
    meta: CellMeta | undefined
    isQuarterEnd: boolean
  }) => {
    const q = meta?.quarter ?? 1
    const color = inkClass(q)
    const fillBg = q === 1 || q === 3 ? "bg-red-600" : "bg-neutral-900"

    if (!meta) {
      return (
        <span className="font-mono text-[10px] text-neutral-400 tabular-nums leading-none">{point}</span>
      )
    }

    if (meta.showSlash) {
      return (
        <span
          className={cn(
            "relative inline-flex min-h-[1.35rem] min-w-[1.35rem] items-center justify-center overflow-visible font-mono text-[11px] font-semibold tabular-nums leading-none select-none",
            color,
            isQuarterEnd && "rounded-full border-[3px] border-current px-0.5 py-0.5"
          )}
        >
          <svg
            className="pointer-events-none absolute left-1/2 top-1/2 z-[5] h-[1.4rem] w-[1.4rem] -translate-x-1/2 -translate-y-1/2 overflow-visible text-current"
            viewBox="0 0 32 32"
            aria-hidden
          >
            <line
              x1="4"
              y1="28"
              x2="28"
              y2="4"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="square"
            />
          </svg>
          <span className="relative z-10">{point}</span>
        </span>
      )
    }

    if (meta.showFilledCircle) {
      return (
        <span className={cn("inline-flex rounded-full", color, isQuarterEnd && "border-[3px] border-current p-[1px]")}>
          <span
            className={cn(
              "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full font-mono text-[9px] font-bold leading-none text-white select-none",
              fillBg
            )}
          >
            {point}
          </span>
        </span>
      )
    }

    return null
  }

  const cellBtn =
    "box-border flex min-h-[28px] w-full items-center justify-center px-0.5 py-0 text-[10px] leading-none font-mono font-semibold tabular-nums"

  const renderScoreBlock = (points: number[]) => (
    <div className="min-w-[7.5rem] flex-1 border border-black bg-white">
      <table className="w-full border-collapse text-[10px] leading-none [table-layout:fixed]">
        <colgroup>
          <col className="w-[22%]" />
          <col className="w-[28%]" />
          <col className="w-[28%]" />
          <col className="w-[22%]" />
        </colgroup>
        <thead>
          <tr>
            <th className="border-b border-r border-black bg-white px-0 py-1 text-center text-[9px] font-bold">
              A
            </th>
            <th className="border-b border-r border-black bg-white px-0 py-1 text-center text-[8px] font-bold">
              得点
            </th>
            <th
              className="border-b border-r border-black px-0 py-1 text-center text-[8px] font-bold"
              style={{ backgroundColor: RUNNING_SCORE_TEAM_B_BG }}
            >
              得点
            </th>
            <th
              className="border-b border-black px-0 py-1 text-center text-[9px] font-bold"
              style={{ backgroundColor: RUNNING_SCORE_TEAM_B_BG }}
            >
              B
            </th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => {
            const metaA = scoreMapA.get(point)
            const metaB = scoreMapB.get(point)
            const qEndA = isQuarterEndScore("A", point)
            const qEndB = isQuarterEndScore("B", point)
            const sepStyleA = quarterLineStylesA.get(point)
            const sepStyleB = quarterLineStylesB.get(point)
            const endGameA = teamGameEndRow("A", point)
            const endGameB = teamGameEndRow("B", point)

            const bottomA = endGameA
              ? "border-b-4 border-double border-black"
              : sepStyleA
                ? quarterSeparatorBottomClassScreen(sepStyleA)
                : "border-b border-black"
            const bottomB = endGameB
              ? "border-b-4 border-double border-black"
              : sepStyleB
                ? quarterSeparatorBottomClassScreen(sepStyleB)
                : "border-b border-black"

            /** Q区切り・試合終了の太横線の行では、A得点とB得点の間の縦線を消す */
            const hideScoreMidVertical =
              Boolean(sepStyleA || sepStyleB) || endGameA || endGameB

            const clickableA =
              (!metaA && point >= totalScoreA + 1) || Boolean(metaA && !metaA.hideJerseyAndScore)
            const clickableB =
              (!metaB && point >= totalScoreB + 1) || Boolean(metaB && !metaB.hideJerseyAndScore)

            return (
              <tr key={point}>
                <td
                  className={cn("border-r border-black bg-white p-0 align-middle", bottomA)}
                >
                  <button
                    type="button"
                    className={cn(
                      cellBtn,
                      "bg-white",
                      clickableA ? "cursor-pointer active:bg-neutral-100" : "cursor-default"
                    )}
                    onClick={() => clickableA && handleTeamClick(point, "A")}
                  >
                    {metaA?.hideJerseyAndScore ? (
                      <span className="select-none" aria-hidden />
                    ) : metaA?.circleJersey ? (
                      <span
                        className={cn(
                          "inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border-[2.5px] border-current font-mono text-[10px] font-bold leading-none",
                          inkClass(metaA.quarter)
                        )}
                      >
                        {metaA.playerNumber}
                      </span>
                    ) : metaA ? (
                      <span className={cn("text-[10px]", inkClass(metaA.quarter))}>{metaA.playerNumber}</span>
                    ) : (
                      <span className="text-transparent select-none">.</span>
                    )}
                  </button>
                </td>
                <td
                  className={cn(
                    "bg-white p-0 align-middle",
                    !hideScoreMidVertical && "border-r border-black",
                    bottomA
                  )}
                >
                  <button
                    type="button"
                    className={cn(
                      cellBtn,
                      "relative overflow-visible bg-white",
                      clickableA ? "cursor-pointer active:bg-neutral-100" : "cursor-default"
                    )}
                    onClick={() => clickableA && handleTeamClick(point, "A")}
                  >
                    {metaA?.hideJerseyAndScore ? null : (
                      <RunningScoreDigit point={point} meta={metaA} isQuarterEnd={qEndA} />
                    )}
                  </button>
                </td>
                <td
                  className={cn("border-r border-black p-0 align-middle", bottomB)}
                  style={{ backgroundColor: RUNNING_SCORE_TEAM_B_BG }}
                >
                  <button
                    type="button"
                    className={cn(
                      cellBtn,
                      "relative overflow-visible",
                      clickableB ? "cursor-pointer active:brightness-95" : "cursor-default"
                    )}
                    style={{ backgroundColor: RUNNING_SCORE_TEAM_B_BG }}
                    onClick={() => {
                      handleCenterTap(point)
                      if (clickableB) handleTeamClick(point, "B")
                    }}
                  >
                    {metaB?.hideJerseyAndScore ? null : (
                      <RunningScoreDigit point={point} meta={metaB} isQuarterEnd={qEndB} />
                    )}
                  </button>
                </td>
                <td
                  className={cn("p-0 align-middle", bottomB)}
                  style={{ backgroundColor: RUNNING_SCORE_TEAM_B_BG }}
                >
                  <button
                    type="button"
                    className={cn(
                      cellBtn,
                      clickableB ? "cursor-pointer active:brightness-95" : "cursor-default"
                    )}
                    style={{ backgroundColor: RUNNING_SCORE_TEAM_B_BG }}
                    onClick={() => clickableB && handleTeamClick(point, "B")}
                  >
                    {metaB?.hideJerseyAndScore ? (
                      <span className="select-none" aria-hidden />
                    ) : metaB?.circleJersey ? (
                      <span
                        className={cn(
                          "inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border-[2.5px] border-current font-mono text-[10px] font-bold leading-none",
                          inkClass(metaB.quarter)
                        )}
                      >
                        {metaB.playerNumber}
                      </span>
                    ) : metaB ? (
                      <span className={cn("text-[10px]", inkClass(metaB.quarter))}>{metaB.playerNumber}</span>
                    ) : (
                      <span className="text-transparent select-none">.</span>
                    )}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  const block1 = Array.from({ length: 40 }, (_, i) => i + 1)
  const block2 = Array.from({ length: 40 }, (_, i) => i + 41)
  const block3 = Array.from({ length: 40 }, (_, i) => i + 81)

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
    <Card className="border-black/80">
      <CardHeader className="space-y-2 pb-2">
        <div className="relative flex items-center border-b-2 border-black pb-1.5">
          <span className="flex-1 text-center text-base font-bold tracking-tight">ランニング・スコア</span>
          <span className="absolute right-0 top-0 text-[11px] font-semibold tracking-[0.15em] text-neutral-700">
            RUNNING
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              A
            </span>
            <span className="max-w-[6rem] truncate text-sm font-medium">{state.teamA.name || "チームA"}</span>
            <span className="font-mono text-xl font-bold">{totalScoreA}</span>
          </div>
          <div className="text-lg font-bold text-muted-foreground">-</div>
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="font-mono text-xl font-bold">{totalScoreB}</span>
            <span className="max-w-[6rem] truncate text-right text-sm font-medium">{state.teamB.name || "チームB"}</span>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              B
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 pb-3">
        <div className="flex gap-1 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
          {renderScoreBlock(block1)}
          {renderScoreBlock(block2)}
          {renderScoreBlock(block3)}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t pt-2 text-[10px] text-muted-foreground">
          <span>1Q/3Q＝赤、2Q/4Q/OT＝黒</span>
          <span>|</span>
          <span>2P/3P＝成立前マスは空欄、成立点のみ得点に／</span>
          <span>|</span>
          <span>3P＝背番号に丸・得点は／のみ</span>
          <span>|</span>
          <span>FT・1点＝得点に塗り丸</span>
          <span>|</span>
          <span>Q終了＝太い〇＋太い横線（自動）</span>
          <span>|</span>
          <span>試合終了＝勝者確定後に二重太線（自動）</span>
          <span>|</span>
          <span>補助線＝B得点列ダブルタップ</span>
        </div>
      </CardContent>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5",
                  addTeam === "A" ? "text-primary" : "text-accent"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white",
                    addTeam === "A" ? "bg-primary" : "bg-accent"
                  )}
                >
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5",
                  editTeam === "A" ? "text-primary" : "text-accent"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white",
                    editTeam === "A" ? "bg-primary" : "bg-accent"
                  )}
                >
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
                  <Trash2 className="h-4 w-4" />
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
