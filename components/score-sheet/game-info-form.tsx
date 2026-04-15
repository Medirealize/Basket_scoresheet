"use client"

import { useScore } from "@/lib/score-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function GameInfoForm() {
  const { state, updateGameInfo } = useScore()
  const { gameInfo } = state

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          試合情報
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tournamentName">大会名</Label>
          <Input
            id="tournamentName"
            placeholder="例：令和6年度宮崎県中学校バスケットボール大会"
            value={gameInfo.tournamentName}
            onChange={(e) => updateGameInfo({ tournamentName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quarterMinutes">1クォーターの時間</Label>
          <Select
            value={String(gameInfo.quarterMinutes)}
            onValueChange={(value) => updateGameInfo({ quarterMinutes: Number(value) })}
          >
            <SelectTrigger id="quarterMinutes">
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6分</SelectItem>
              <SelectItem value="7">7分</SelectItem>
              <SelectItem value="8">8分（中学標準）</SelectItem>
              <SelectItem value="10">10分（高校・一般）</SelectItem>
              <SelectItem value="12">12分</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="date">日付</Label>
            <Input
              id="date"
              type="date"
              value={gameInfo.date}
              onChange={(e) => updateGameInfo({ date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue">場所</Label>
            <Input
              id="venue"
              placeholder="例：宮崎市総合体育館"
              value={gameInfo.venue}
              onChange={(e) => updateGameInfo({ venue: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="startTime">開始時間</Label>
            <Input
              id="startTime"
              type="time"
              value={gameInfo.startTime}
              onChange={(e) => updateGameInfo({ startTime: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">終了時間</Label>
            <Input
              id="endTime"
              type="time"
              value={gameInfo.endTime}
              onChange={(e) => updateGameInfo({ endTime: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="gameNumber">試合No.</Label>
            <Input
              id="gameNumber"
              placeholder="例：C28"
              value={gameInfo.gameNumber}
              onChange={(e) => updateGameInfo({ gameNumber: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="programPage">ページ</Label>
            <Input
              id="programPage"
              type="number"
              placeholder="例：16"
              value={gameInfo.programPage}
              onChange={(e) => updateGameInfo({ programPage: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="block">ブロック</Label>
            <Input
              id="block"
              placeholder="例：A"
              value={gameInfo.block}
              onChange={(e) => updateGameInfo({ block: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
