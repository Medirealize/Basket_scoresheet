"use client"

import { useScore } from "@/lib/score-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function QuarterControl() {
  const { state, setCurrentQuarter, getQuarterScore, getTotalScore } = useScore()

  const quarters = [
    { value: 1, label: "1Q", color: "text-red-600 border-red-600 hover:bg-red-50" },
    { value: 2, label: "2Q", color: "text-foreground border-foreground hover:bg-muted" },
    { value: 3, label: "3Q", color: "text-red-600 border-red-600 hover:bg-red-50" },
    { value: 4, label: "4Q", color: "text-foreground border-foreground hover:bg-muted" },
    { value: 5, label: "OT", color: "text-foreground border-foreground hover:bg-muted" },
  ]

  return (
    <Card className="bg-card sticky top-0 z-10">
      <CardContent className="py-4">
        <div className="flex flex-col gap-4">
          {/* スコア表示 */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">
                {state.teamA.name || "チームA"}
              </div>
              <div className="text-4xl font-bold font-mono text-primary">
                {getTotalScore("A")}
              </div>
            </div>
            <div className="text-2xl text-muted-foreground">-</div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">
                {state.teamB.name || "チームB"}
              </div>
              <div className="text-4xl font-bold font-mono text-accent">
                {getTotalScore("B")}
              </div>
            </div>
          </div>

          {/* クォーター選択 */}
          <div className="flex justify-center gap-2">
            {quarters.map((q) => (
              <Button
                key={q.value}
                variant={state.currentQuarter === q.value ? "default" : "outline"}
                className={cn(
                  "min-w-14 font-bold",
                  state.currentQuarter !== q.value && q.color
                )}
                onClick={() => setCurrentQuarter(q.value)}
              >
                {q.label}
              </Button>
            ))}
          </div>

          {/* クォーター別スコア一覧 */}
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {quarters.map((q) => (
              <div key={q.value} className="space-y-0.5">
                <div className={cn(
                  "font-medium",
                  q.value === 1 || q.value === 3 ? "text-red-600" : "text-muted-foreground"
                )}>
                  {q.label}
                </div>
                <div className="flex justify-center gap-1">
                  <span className={cn(
                    "font-mono",
                    q.value === 1 || q.value === 3 ? "text-red-600" : ""
                  )}>
                    {getQuarterScore("A", q.value)}
                  </span>
                  <span className="text-muted-foreground">-</span>
                  <span className={cn(
                    "font-mono",
                    q.value === 1 || q.value === 3 ? "text-red-600" : ""
                  )}>
                    {getQuarterScore("B", q.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
