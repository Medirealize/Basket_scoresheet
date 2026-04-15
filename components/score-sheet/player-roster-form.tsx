"use client"

import { useState } from "react"
import { useScore, type FoulType, type FoulRecord } from "@/lib/score-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Plus, Minus, ChevronDown, ChevronUp } from "lucide-react"
import { TeamFoulCounter } from "./team-foul-counter"

interface PlayerRosterFormProps {
  team: "A" | "B"
}

const FOUL_TYPES: { value: FoulType; label: string; description: string }[] = [
  { value: "P", label: "P", description: "パーソナル" },
  { value: "P1", label: "P1", description: "1スロー" },
  { value: "P2", label: "P2", description: "2スロー" },
  { value: "P3", label: "P3", description: "3スロー" },
  { value: "T", label: "T", description: "テクニカル" },
  { value: "T1", label: "T1", description: "テク1スロー" },
  { value: "U", label: "U", description: "アンスポ" },
  { value: "U1", label: "U1", description: "アンスポ1" },
  { value: "U2", label: "U2", description: "アンスポ2" },
  { value: "D", label: "D", description: "失格" },
  { value: "C", label: "C", description: "コーチT自身" },
  { value: "B", label: "B", description: "コーチT他" },
]

// 1Q, 3Qは赤字、2Q, 4Qは黒字
const getQuarterTextColor = (quarter: number) => {
  if (quarter === 1 || quarter === 3) return "text-red-600"
  return "text-foreground"
}

// 各Q間に太黒線を引くかどうか（Q番号が変わったら線を引く）
const shouldShowQuarterSeparator = (fouls: FoulRecord[], index: number) => {
  if (index === 0) return false
  const currentFoul = fouls[index]
  const prevFoul = fouls[index - 1]
  // クォーターが変わったら線を引く
  return currentFoul.quarter !== prevFoul.quarter
}

export function PlayerRosterForm({ team }: PlayerRosterFormProps) {
  const { state, updatePlayer, addFoul, removeFoul } = useScore()
  const teamData = team === "A" ? state.teamA : state.teamB
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null)

  const handleFoulAdd = (playerIndex: number, foulType: FoulType) => {
    if (teamData.players[playerIndex].fouls.length < 5) {
      addFoul(team, playerIndex, foulType)
    }
  }

  // 登録済み選手数をカウント
  const registeredCount = teamData.players.filter(p => p.number).length

  return (
    <Card className={cn(
      "border-l-4",
      team === "A" ? "border-l-primary" : "border-l-accent"
    )}>
      <CardHeader className="pb-2 px-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <span className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground",
                team === "A" ? "bg-primary" : "bg-accent"
              )}>
                {team}
              </span>
              <span className="truncate">{teamData.name || `チーム${team}`}</span>
              <Badge variant="outline" className="ml-1 text-xs">
                {registeredCount}名
              </Badge>
            </CardTitle>
          </div>
          <TeamFoulCounter team={team} />
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
          {teamData.players.map((player, index) => {
            const isExpanded = expandedPlayer === index
            const hasFouls = player.fouls.length > 0
            const isFouledOut = player.fouls.length >= 5

            return (
              <div
                key={index}
                className={cn(
                  "rounded-lg border transition-all",
                  player.number ? "bg-card" : "bg-muted/20 border-dashed",
                  isFouledOut && "bg-destructive/10 border-destructive/30"
                )}
              >
                {/* メイン行 - 常に表示 */}
                <div 
                  className="flex items-center gap-2 p-2 cursor-pointer"
                  onClick={() => setExpandedPlayer(isExpanded ? null : index)}
                >
                  {/* 出場チェック */}
                  <Checkbox
                    checked={player.isPlaying}
                    onCheckedChange={(checked) => {
                      updatePlayer(team, index, { isPlaying: checked === true })
                    }}
                    disabled={!player.number}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0"
                  />

                  {/* 背番号 */}
                  <div className="relative shrink-0">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      placeholder="-"
                      className="w-12 text-center h-8 text-sm font-bold px-1 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      value={player.number}
                      onChange={(e) => updatePlayer(team, index, { number: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {player.isCaptain && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                        C
                      </span>
                    )}
                  </div>

                  {/* 氏名 */}
                  <Input
                    placeholder="選手名"
                    className="flex-1 h-8 text-sm min-w-0"
                    value={player.name}
                    onChange={(e) => updatePlayer(team, index, { name: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />

                  {/* ファウル数バッジ */}
                  {hasFouls && (
                    <Badge 
                      variant={isFouledOut ? "destructive" : "secondary"}
                      className="shrink-0 text-xs px-1.5"
                    >
                      F{player.fouls.length}
                    </Badge>
                  )}

                  {/* 展開アイコン */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedPlayer(isExpanded ? null : index)
                    }}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* 展開時の詳細 */}
                {isExpanded && (
                  <div className="px-2 pb-2 pt-1 border-t bg-muted/30 space-y-3">
                    {/* キャプテン設定 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">キャプテン</span>
                      <Button
                        variant={player.isCaptain ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-8 px-3 font-bold",
                          player.isCaptain && "bg-amber-500 hover:bg-amber-600 text-white"
                        )}
                        onClick={() => updatePlayer(team, index, { isCaptain: !player.isCaptain })}
                      >
                        {player.isCaptain ? "C (キャプテン)" : "設定する"}
                      </Button>
                    </div>

                    {/* ファウル表示 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">ファウル</span>
                        {player.fouls.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive"
                            onClick={() => removeFoul(team, index)}
                          >
                            <Minus className="h-3 w-3 mr-1" />
                            取消
                          </Button>
                        )}
                      </div>
                      
                      {/* ファウルバッジ表示 - クォーター色分け＆前後半の区切り線 */}
                      <div className="flex gap-1 flex-wrap items-center">
                        {player.fouls.map((foul, foulIndex) => (
                          <div key={foulIndex} className="flex items-center">
                            {/* Q間の区切り太黒線 */}
                            {shouldShowQuarterSeparator(player.fouls, foulIndex) && (
                              <div className="w-0.5 h-6 bg-foreground mr-1" />
                            )}
                            <Badge
                              variant={foul.type.startsWith("U") || foul.type === "D" ? "destructive" : "outline"}
                              className={cn(
                                "text-sm px-2 py-0.5 font-bold",
                                getQuarterTextColor(foul.quarter),
                                foul.type.startsWith("U") || foul.type === "D" ? "" : "bg-background"
                              )}
                            >
                              {foul.type}
                            </Badge>
                          </div>
                        ))}
                        {Array.from({ length: 5 - player.fouls.length }).map((_, i) => (
                          <div 
                            key={i} 
                            className="w-8 h-6 border border-dashed border-muted-foreground/30 rounded flex items-center justify-center text-xs text-muted-foreground/50"
                          >
                            {player.fouls.length + i + 1}
                          </div>
                        ))}
                      </div>

                      {/* ファウル追加ボタン */}
                      {!isFouledOut && player.number && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full h-9"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              ファウル追加 (Q{state.currentQuarter})
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] sm:max-w-sm">
                            <DialogHeader>
                              <DialogTitle className="text-center">
                                ファウル追加
                                <div className="text-sm font-normal text-muted-foreground mt-1">
                                  #{player.number} {player.name || "選手"}
                                </div>
                                <div className={cn("text-sm mt-1", getQuarterTextColor(state.currentQuarter))}>
                                  現在: {state.currentQuarter}Q ({state.currentQuarter === 1 || state.currentQuarter === 3 ? "赤" : "黒"})
                                </div>
                              </DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-3 gap-2 pt-2">
                              {FOUL_TYPES.map((foul) => (
                                <Button
                                  key={foul.value}
                                  variant="outline"
                                  className={cn(
                                    "h-14 flex flex-col gap-0.5 p-1",
                                    getQuarterTextColor(state.currentQuarter)
                                  )}
                                  onClick={() => handleFoulAdd(index, foul.value)}
                                >
                                  <span className="font-bold text-lg">{foul.label}</span>
                                  <span className="text-[9px] text-muted-foreground leading-tight">
                                    {foul.description}
                                  </span>
                                </Button>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
