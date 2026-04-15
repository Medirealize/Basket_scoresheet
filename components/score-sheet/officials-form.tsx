"use client"

import { useScore } from "@/lib/score-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users } from "lucide-react"

export function OfficialsForm() {
  const { state, updateOfficials } = useScore()
  const { officials } = state

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          審判・オフィシャルズ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 審判員 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">審判員</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="crewChief">クルーチーフ</Label>
              <Input
                id="crewChief"
                placeholder="氏名"
                value={officials.crewChief}
                onChange={(e) => updateOfficials({ crewChief: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="umpire1">1st アンパイア</Label>
              <Input
                id="umpire1"
                placeholder="氏名"
                value={officials.umpire1}
                onChange={(e) => updateOfficials({ umpire1: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="umpire2">2nd アンパイア</Label>
              <Input
                id="umpire2"
                placeholder="氏名"
                value={officials.umpire2}
                onChange={(e) => updateOfficials({ umpire2: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* テーブルオフィシャルズ */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">テーブルオフィシャルズ</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label htmlFor="scorer">スコアラー</Label>
              <Input
                id="scorer"
                placeholder="氏名"
                value={officials.scorer}
                onChange={(e) => updateOfficials({ scorer: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assistantScorer">Aスコアラー</Label>
              <Input
                id="assistantScorer"
                placeholder="氏名"
                value={officials.assistantScorer}
                onChange={(e) => updateOfficials({ assistantScorer: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timer">タイマー</Label>
              <Input
                id="timer"
                placeholder="氏名"
                value={officials.timer}
                onChange={(e) => updateOfficials({ timer: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shotClockOperator">ショットクロック</Label>
              <Input
                id="shotClockOperator"
                placeholder="氏名"
                value={officials.shotClockOperator}
                onChange={(e) => updateOfficials({ shotClockOperator: e.target.value })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
