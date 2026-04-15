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
import { Trash2 } from "lucide-react"

export function CombinedScoreGrid() {
  const { state, getTotalScore, addScore, removeLastScore } = useScore()
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<"A" | "B" | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<string>("")
  
  // 削除確認ダイアログ用
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTeam, setDeleteTeam] = useState<"A" | "B" | null>(null)
  const [deletePoint, setDeletePoint] = useState<number | null>(null)

  // 各チームの得点履歴を取得
  const getScoreMap = (team: "A" | "B") => {
    const scoreEntries = state.scoreEntries.filter((e) => e.team === team)
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
    return scoredPoints
  }

  // 各Q終了時点のスコアを取得（太黒線用）
  const getQuarterEndScore = (team: "A" | "B", quarter: number) => {
    const entries = state.scoreEntries.filter(
      (e) => e.team === team && e.quarter === quarter
    )
    if (entries.length === 0) return 0
    return Math.max(...entries.map(e => e.totalScore))
  }

  // 各Q終了時点のスコアをセットで管理
  const quarterEndScoresA = new Set([
    getQuarterEndScore("A", 1),
    getQuarterEndScore("A", 2),
    getQuarterEndScore("A", 3),
  ].filter(s => s > 0))

  const quarterEndScoresB = new Set([
    getQuarterEndScore("B", 1),
    getQuarterEndScore("B", 2),
    getQuarterEndScore("B", 3),
  ].filter(s => s > 0))

  const scoreMapA = getScoreMap("A")
  const scoreMapB = getScoreMap("B")
  const totalScoreA = getTotalScore("A")
  const totalScoreB = getTotalScore("B")

  // クォーターの色を取得（1Q/3Qは赤、2Q/4Qは黒）
  const getQuarterTextColor = (quarter: number) => {
    return quarter === 1 || quarter === 3 ? "text-red-600" : "text-foreground"
  }

  // 選手リストを取得
  const getPlayerList = (team: "A" | "B") => {
    const teamData = team === "A" ? state.teamA : state.teamB
    const activePlayers = teamData.players.filter((p) => p.number && p.isPlaying)
    const allPlayers = teamData.players.filter((p) => p.number)
    return activePlayers.length > 0 ? activePlayers : allPlayers
  }

  // セルをタップしたときの処理
  const handleCellClick = (point: number, team: "A" | "B") => {
    const totalScore = team === "A" ? totalScoreA : totalScoreB
    const scoreMap = team === "A" ? scoreMapA : scoreMapB
    
    // 既にスコアされている場合は何もしない
    if (scoreMap.has(point)) return
    
    // 次の得点可能な点数以降をタップした場合のみダイアログを開く
    if (point >= totalScore + 1) {
      setSelectedPoint(point)
      setSelectedTeam(team)
      setSelectedPlayer("")
      setDialogOpen(true)
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

  // 得点済みセルをタップしたときの処理（削除確認）
  const handleScoredCellClick = (point: number, team: "A" | "B") => {
    const totalScore = team === "A" ? totalScoreA : totalScoreB
    // 最新の得点（totalScore）のセルのみ削除可能
    if (point === totalScore) {
      setDeleteTeam(team)
      setDeletePoint(point)
      setDeleteDialogOpen(true)
    }
  }

  // 得点を削除
  const handleDeleteScore = () => {
    if (deleteTeam) {
      removeLastScore(deleteTeam)
    }
    setDeleteDialogOpen(false)
    setDeleteTeam(null)
    setDeletePoint(null)
  }

  // 縦に1〜160点を8列で表示（各列20点ずつ）
  const columns = 8
  const rowsPerColumn = 20
  
  // 列ごとのデータを作成
  const columnData: number[][] = []
  for (let col = 0; col < columns; col++) {
    const colPoints: number[] = []
    for (let row = 0; row < rowsPerColumn; row++) {
      const point = col * rowsPerColumn + row + 1
      if (point <= 160) {
        colPoints.push(point)
      }
    }
    columnData.push(colPoints)
  }

  const playerListForDialog = selectedTeam ? getPlayerList(selectedTeam) : []

  // 背番号を表示するセル
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

  // 得点セルを描画
  const renderScoreCell = (
    point: number,
    entryA: { playerNumber: string; quarter: number; isThreePointer: boolean } | undefined,
    entryB: { playerNumber: string; quarter: number; isThreePointer: boolean } | undefined
  ) => {
    const isScoredA = !!entryA
    const isScoredB = !!entryB
    
    // 両チームとも未得点
    if (!isScoredA && !isScoredB) {
      const isNextA = point === totalScoreA + 1
      const isNextB = point === totalScoreB + 1
      return (
        <span className={cn(
          "text-[10px]",
          (isNextA || isNextB) ? "text-primary font-bold" : "text-muted-foreground"
        )}>
          {point}
        </span>
      )
    }
    
    // 片方または両方が得点済み - スラッシュ表示
    return (
      <div className="w-full h-full flex items-center justify-center relative">
        {/* Aチームのスラッシュ */}
        {isScoredA && (
          <svg 
            className={cn("absolute inset-0 w-full h-full pointer-events-none", getQuarterTextColor(entryA.quarter))}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <line x1="20" y1="80" x2="80" y2="20" stroke="currentColor" strokeWidth="4" />
          </svg>
        )}
        {/* Bチームのスラッシュ（逆向き） */}
        {isScoredB && (
          <svg 
            className={cn("absolute inset-0 w-full h-full pointer-events-none", getQuarterTextColor(entryB.quarter))}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="4" />
          </svg>
        )}
        <span className="relative z-10 text-[10px] text-muted-foreground/50">{point}</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-center">ランニングスコア</CardTitle>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
              A
            </span>
            <span className="font-medium text-sm">{state.teamA.name || "チームA"}</span>
            <span className="text-2xl font-bold font-mono">{totalScoreA}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono">{totalScoreB}</span>
            <span className="font-medium text-sm">{state.teamB.name || "チームB"}</span>
            <span className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-accent-foreground">
              B
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2">
        <div className="overflow-x-auto">
          {/* 8列構成: 各列は [A背番号 | 点数 | B背番号] */}
          <div className="flex gap-0.5 min-w-fit">
            {columnData.map((colPoints, colIndex) => (
              <div key={colIndex} className="flex-1 min-w-[100px]">
                {/* ヘッダー */}
                <div className="grid grid-cols-3 text-[8px] font-medium border-b border-border mb-0.5">
                  <div className="text-center text-primary py-0.5">A</div>
                  <div className="text-center text-muted-foreground py-0.5">点</div>
                  <div className="text-center text-accent py-0.5">B</div>
                </div>
                {/* 点数行 */}
                {colPoints.map((point) => {
                  const entryA = scoreMapA.get(point)
                  const entryB = scoreMapB.get(point)
                  const isScoredA = !!entryA
                  const isScoredB = !!entryB
                  
                  // 各Q終了時点の下に太黒線を引く
                  const isQuarterEndA = quarterEndScoresA.has(point)
                  const isQuarterEndB = quarterEndScoresB.has(point)
                  const hasQuarterEndLine = isQuarterEndA || isQuarterEndB
                  
                  return (
                    <div 
                      key={point} 
                      className={cn(
                        "grid grid-cols-3 border-b h-7",
                        hasQuarterEndLine ? "border-b-2 border-foreground" : "border-border/50"
                      )}
                    >
                      {/* Aチーム背番号 */}
                      <div 
                        className={cn(
                          "flex items-center justify-center bg-primary/5",
                          !isScoredA && point >= totalScoreA + 1 && "cursor-pointer hover:bg-primary/20 active:bg-primary/30",
                          isScoredA && point === totalScoreA && "cursor-pointer hover:bg-red-100 active:bg-red-200"
                        )}
                        onClick={() => {
                          if (isScoredA && point === totalScoreA) {
                            handleScoredCellClick(point, "A")
                          } else if (!isScoredA) {
                            handleCellClick(point, "A")
                          }
                        }}
                      >
                        {renderPlayerNumber(entryA)}
                      </div>
                      
                      {/* 点数 */}
                      <div className="flex items-center justify-center border-x border-border/30">
                        {renderScoreCell(point, entryA, entryB)}
                      </div>
                      
                      {/* Bチーム背番号 */}
                      <div 
                        className={cn(
                          "flex items-center justify-center bg-accent/5",
                          !isScoredB && point >= totalScoreB + 1 && "cursor-pointer hover:bg-accent/20 active:bg-accent/30",
                          isScoredB && point === totalScoreB && "cursor-pointer hover:bg-red-100 active:bg-red-200"
                        )}
                        onClick={() => {
                          if (isScoredB && point === totalScoreB) {
                            handleScoredCellClick(point, "B")
                          } else if (!isScoredB) {
                            handleCellClick(point, "B")
                          }
                        }}
                      >
                        {renderPlayerNumber(entryB)}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 凡例 */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-red-600 font-bold">赤</span>
            <span className="text-muted-foreground">= 1Q/3Q</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-foreground font-bold">黒</span>
            <span className="text-muted-foreground">= 2Q/4Q</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold border border-current rounded-full px-1">5</span>
            <span className="text-muted-foreground">= 3P</span>
          </div>
        </div>
      </CardContent>

      {/* 得点入力ダイアログ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">
              <span className={cn(
                "inline-flex items-center gap-2",
                selectedTeam === "A" ? "text-primary" : "text-accent"
              )}>
                <span className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white",
                  selectedTeam === "A" ? "bg-primary" : "bg-accent"
                )}>
                  {selectedTeam}
                </span>
                {selectedTeam === "A" ? state.teamA.name || "チームA" : state.teamB.name || "チームB"}
              </span>
              <br />
              <span className="text-lg">{selectedPoint}点目を記録</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* 選手選択 */}
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

            {/* 2P / 3P 選択ボタン */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-16 text-lg font-bold"
                onClick={() => handleAddScore(false)}
                disabled={!selectedPlayer}
              >
                通常
                <span className="text-xs text-muted-foreground ml-1">(FT/2P)</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 text-lg font-bold border-2 border-primary"
                onClick={() => handleAddScore(true)}
                disabled={!selectedPlayer}
              >
                <span className="border-2 border-current rounded-full px-2 py-1">3P</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">
              <Trash2 className="w-8 h-8 mx-auto mb-2 text-destructive" />
              得点を取り消しますか？
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-center text-sm text-muted-foreground">
              {deleteTeam === "A" ? state.teamA.name || "チームA" : state.teamB.name || "チー���B"} の
              最後の得点（{deletePoint}点目）を取り消します。
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteScore}
              >
                取り消す
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
