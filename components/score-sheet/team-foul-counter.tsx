"use client"

import { useScore } from "@/lib/score-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Plus, Minus } from "lucide-react"

interface TeamFoulCounterProps {
  team: "A" | "B"
}

export function TeamFoulCounter({ team }: TeamFoulCounterProps) {
  const { state, updateTeamA, updateTeamB } = useScore()
  const teamData = team === "A" ? state.teamA : state.teamB
  const updateTeam = team === "A" ? updateTeamA : updateTeamB
  const currentQ = state.currentQuarter - 1

  const teamFouls = teamData.teamFouls[currentQ] || [0, 0, 0, 0]
  const currentFoulCount = teamFouls.reduce((sum, f) => sum + f, 0)

  const incrementFoul = () => {
    if (currentFoulCount >= 5) return
    const newTeamFouls = [...teamData.teamFouls]
    newTeamFouls[currentQ] = [...newTeamFouls[currentQ]]
    newTeamFouls[currentQ][currentFoulCount] = 1
    updateTeam({ teamFouls: newTeamFouls })
  }

  const decrementFoul = () => {
    if (currentFoulCount <= 0) return
    const newTeamFouls = [...teamData.teamFouls]
    newTeamFouls[currentQ] = [...newTeamFouls[currentQ]]
    newTeamFouls[currentQ][currentFoulCount - 1] = 0
    updateTeam({ teamFouls: newTeamFouls })
  }

  return (
    <div className={cn(
      "flex flex-wrap items-center gap-2 px-2 py-1.5 rounded-lg border",
      team === "A" ? "border-primary/30 bg-primary/5" : "border-accent/30 bg-accent/5"
    )}>
      <span className="text-xs font-medium whitespace-nowrap">
        TF Q{state.currentQuarter}
      </span>
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={decrementFoul}
          disabled={currentFoulCount <= 0}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((num) => (
            <div
              key={num}
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border",
                num <= currentFoulCount
                  ? team === "A"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-accent text-accent-foreground border-accent"
                  : "border-muted-foreground/30 text-muted-foreground/50",
                num === 5 && num <= currentFoulCount && "bg-destructive border-destructive"
              )}
            >
              {num}
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={incrementFoul}
          disabled={currentFoulCount >= 5}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
