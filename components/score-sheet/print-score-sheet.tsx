"use client"

import { useMemo } from "react"
import { useScore } from "@/lib/score-context"
import {
  RUNNING_SCORE_TEAM_B_BG,
  getRunningCellMeta,
  lastRunningScoreByQuarter,
  quarterSeparatorBottomClassPrint,
  quarterSeparatorLineStylesByPoint,
} from "@/lib/running-score-helpers"
import { normalizeQuarterMinutes } from "@/lib/timeout-sheet"
import { cn } from "@/lib/utils"

export function PrintScoreSheet() {
  const { state, getTotalScore, getQuarterScore } = useScore()

  const totalScoreA = getTotalScore("A")
  const totalScoreB = getTotalScore("B")

  const runningBlocks = useMemo(
    () => [
      Array.from({ length: 40 }, (_, i) => i + 1),
      Array.from({ length: 40 }, (_, i) => i + 41),
      Array.from({ length: 40 }, (_, i) => i + 81),
    ],
    []
  )

  const quarterLineStylesByPoint = useMemo(
    () => quarterSeparatorLineStylesByPoint(state.scoreEntries, state.quarterLines),
    [state.scoreEntries, state.quarterLines]
  )
  const qEndA = useMemo(
    () => new Set(lastRunningScoreByQuarter(state.scoreEntries, "A").values()),
    [state.scoreEntries]
  )
  const qEndB = useMemo(
    () => new Set(lastRunningScoreByQuarter(state.scoreEntries, "B").values()),
    [state.scoreEntries]
  )

  // クォーターの色を取得
  const getQuarterColor = (quarter: number) => {
    return quarter === 1 || quarter === 3 ? "text-red-600" : "text-black"
  }

  // 登録済み選手のみ取得
  const getActivePlayers = (team: "A" | "B") => {
    const players = team === "A" ? state.teamA.players : state.teamB.players
    return players.filter(p => p.number || p.name)
  }

  // タイムアウト使用数を取得
  const getTimeoutCount = (team: "A" | "B", half: number) => {
    const teamData = team === "A" ? state.teamA : state.teamB
    return teamData.timeouts[half].filter(t => t.used).length
  }

  // タイムアウトの詳細を取得
  const getTimeoutDetails = (team: "A" | "B") => {
    const teamData = team === "A" ? state.teamA : state.teamB
    const details: string[] = []
    
    // 前半 (1Q, 2Q)
    teamData.timeouts[0].forEach((t, i) => {
      if (t.used) {
        details.push(`${t.quarter}Q経過${t.time}分`)
      } else if (t.cancelled) {
        details.push("--")
      }
    })
    
    // 後半 (3Q, 4Q)
    teamData.timeouts[1].forEach((t, i) => {
      if (t.used) {
        details.push(`${t.quarter}Q経過${t.time}分`)
      } else if (t.cancelled) {
        details.push("--")
      }
    })
    
    return details.join(" / ")
  }

  return (
    <div className="print-score-sheet bg-white text-black p-4 text-[10px] leading-tight">
      {/* ヘッダー */}
      <div className="text-center border-b-2 border-black pb-2 mb-2">
        <h1 className="text-base font-bold">バスケットボール スコアシート</h1>
      </div>

      {/* 試合情報 */}
      <div className="grid grid-cols-4 gap-2 mb-2 border border-black p-2">
        <div className="col-span-2">
          <span className="font-bold">大会名: </span>
          <span className="border-b border-black inline-block min-w-[150px]">{state.gameInfo.tournamentName}</span>
        </div>
        <div>
          <span className="font-bold">試合番号: </span>
          <span className="border-b border-black inline-block min-w-[50px]">{state.gameInfo.gameNumber}</span>
        </div>
        <div>
          <span className="font-bold">日付: </span>
          <span className="border-b border-black inline-block min-w-[80px]">{state.gameInfo.date}</span>
        </div>
        <div>
          <span className="font-bold">会場: </span>
          <span className="border-b border-black inline-block min-w-[100px]">{state.gameInfo.venue}</span>
        </div>
        <div>
          <span className="font-bold">開始: </span>
          <span className="border-b border-black inline-block min-w-[50px]">{state.gameInfo.startTime}</span>
        </div>
        <div>
          <span className="font-bold">終了: </span>
          <span className="border-b border-black inline-block min-w-[50px]">{state.gameInfo.endTime}</span>
        </div>
        <div>
          <span className="font-bold">Q時間: </span>
          <span className="border-b border-black inline-block min-w-[30px]">
            {normalizeQuarterMinutes(state.gameInfo.quarterMinutes)}分
          </span>
        </div>
      </div>

      {/* チーム情報と選手一覧 */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* チームA */}
        <div className="border border-black">
          <div className="bg-gray-200 p-1 font-bold text-center border-b border-black">
            チームA: {state.teamA.name || "―"}
          </div>
          <div className="p-1 border-b border-black text-[9px]">
            <span>コーチ: {state.teamA.coach || "―"}</span>
            <span className="ml-2">Aコーチ: {state.teamA.assistantCoach || "―"}</span>
          </div>
          <table className="w-full text-[8px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border-r border-black w-8 p-0.5">No.</th>
                <th className="border-r border-black p-0.5">氏名</th>
                <th className="border-r border-black w-6 p-0.5">C</th>
                <th className="w-24 p-0.5">ファウル</th>
              </tr>
            </thead>
            <tbody>
              {getActivePlayers("A").slice(0, 12).map((player, index) => (
                <tr key={index} className="border-t border-gray-300">
                  <td className="border-r border-black text-center p-0.5 font-mono">{player.number}</td>
                  <td className="border-r border-black p-0.5">{player.name}</td>
                  <td className="border-r border-black text-center p-0.5">{player.isCaptain ? "●" : ""}</td>
                  <td className="p-0.5 text-center font-mono">
                    {player.fouls.map((f, i) => (
                      <span key={i} className={cn(
                        "mr-0.5",
                        getQuarterColor(f.quarter)
                      )}>
                        {f.type}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* チームB */}
        <div className="border border-black">
          <div className="bg-gray-200 p-1 font-bold text-center border-b border-black">
            チームB: {state.teamB.name || "―"}
          </div>
          <div className="p-1 border-b border-black text-[9px]">
            <span>コーチ: {state.teamB.coach || "―"}</span>
            <span className="ml-2">Aコーチ: {state.teamB.assistantCoach || "―"}</span>
          </div>
          <table className="w-full text-[8px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border-r border-black w-8 p-0.5">No.</th>
                <th className="border-r border-black p-0.5">氏名</th>
                <th className="border-r border-black w-6 p-0.5">C</th>
                <th className="w-24 p-0.5">ファウル</th>
              </tr>
            </thead>
            <tbody>
              {getActivePlayers("B").slice(0, 12).map((player, index) => (
                <tr key={index} className="border-t border-gray-300">
                  <td className="border-r border-black text-center p-0.5 font-mono">{player.number}</td>
                  <td className="border-r border-black p-0.5">{player.name}</td>
                  <td className="border-r border-black text-center p-0.5">{player.isCaptain ? "●" : ""}</td>
                  <td className="p-0.5 text-center font-mono">
                    {player.fouls.map((f, i) => (
                      <span key={i} className={cn(
                        "mr-0.5",
                        getQuarterColor(f.quarter)
                      )}>
                        {f.type}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ランニングスコア（公式用紙に近い 40×3 ブロック） */}
      <div className="mb-2 border border-black">
        <div className="relative border-b border-black bg-gray-100 px-2 py-1 text-center font-bold">
          <span className="text-[9px]">ランニング・スコア</span>
          <span className="absolute right-2 top-1 text-[6px] font-semibold tracking-wider">RUNNING</span>
        </div>
        <div className="flex border-b border-black text-[6px]">
          {runningBlocks.map((colPoints, blockIdx) => (
            <div
              key={blockIdx}
              className={cn("min-w-0 flex-1 border-black", blockIdx < 2 ? "border-r" : "")}
            >
              <div className="flex border-b border-black font-bold leading-none">
                <div className="flex flex-[2] border-r border-black">
                  <div className="flex w-[22%] items-center justify-center border-r border-black bg-white py-0.5">
                    A
                  </div>
                  <div className="flex flex-1 items-center justify-center bg-white py-0.5">得点</div>
                </div>
                <div className="flex flex-[2]">
                  <div
                    className="flex flex-1 items-center justify-center border-r border-black py-0.5"
                    style={{ backgroundColor: RUNNING_SCORE_TEAM_B_BG }}
                  >
                    得点
                  </div>
                  <div
                    className="flex w-[22%] items-center justify-center py-0.5"
                    style={{ backgroundColor: RUNNING_SCORE_TEAM_B_BG }}
                  >
                    B
                  </div>
                </div>
              </div>
              {colPoints.map((point) => {
                const metaA = getRunningCellMeta(state.scoreEntries, "A", point)
                const metaB = getRunningCellMeta(state.scoreEntries, "B", point)
                const sepStyle = quarterLineStylesByPoint.get(point)
                const gameDone = Boolean(state.winner)
                const endA = gameDone && point === totalScoreA && totalScoreA + totalScoreB > 0
                const endB = gameDone && point === totalScoreB && totalScoreA + totalScoreB > 0
                const bottomA = endA
                  ? "border-b-2 border-double border-black"
                  : sepStyle
                    ? quarterSeparatorBottomClassPrint(sepStyle)
                    : "border-b border-gray-200"
                const bottomB = endB
                  ? "border-b-2 border-double border-black"
                  : sepStyle
                    ? quarterSeparatorBottomClassPrint(sepStyle)
                    : "border-b border-gray-200"

                const renderScore = (meta: ReturnType<typeof getRunningCellMeta>, qEnd: boolean) => {
                  if (!meta) {
                    return <span className="text-gray-400">{point}</span>
                  }
                  if (meta.hideJerseyAndScore) {
                    return <span className="select-none" />
                  }
                  const fillBg = meta.quarter === 1 || meta.quarter === 3 ? "bg-red-600" : "bg-black"
                  if (meta.showSlash) {
                    return (
                      <span
                        className={cn(
                          "relative inline-flex min-h-[0.65rem] min-w-[0.65rem] items-center justify-center overflow-visible font-mono font-semibold",
                          getQuarterColor(meta.quarter),
                          qEnd && "rounded-full border-[1.5px] border-current px-[1px]"
                        )}
                      >
                        <svg
                          className="pointer-events-none absolute left-1/2 top-1/2 z-[5] h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 text-current"
                          viewBox="0 0 32 32"
                          aria-hidden
                        >
                          <line
                            x1="4"
                            y1="28"
                            x2="28"
                            y2="4"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="square"
                          />
                        </svg>
                        <span className="relative z-10">{point}</span>
                      </span>
                    )
                  }
                  if (meta.showFilledCircle) {
                    return (
                      <span
                        className={cn(
                          "inline-flex rounded-full",
                          getQuarterColor(meta.quarter),
                          qEnd && "border-[1.5px] border-current p-[0.5px]"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex min-h-[10px] min-w-[10px] items-center justify-center rounded-full font-mono text-[6px] font-bold leading-none text-white",
                            fillBg
                          )}
                        >
                          {point}
                        </span>
                      </span>
                    )
                  }
                  return <span className="select-none" />
                }

                return (
                  <div key={point} className="flex min-h-[10px] leading-none">
                    <div
                      className={cn(
                        "flex w-[22%] items-center justify-center border-r border-black bg-white font-mono",
                        bottomA
                      )}
                    >
                      {metaA?.hideJerseyAndScore ? (
                        <span className="select-none" />
                      ) : metaA?.circleJersey ? (
                        <span
                          className={cn(
                            "inline-flex min-h-[10px] min-w-[10px] items-center justify-center rounded-full border border-current font-mono text-[6px] font-bold",
                            getQuarterColor(metaA.quarter)
                          )}
                        >
                          {metaA.playerNumber}
                        </span>
                      ) : metaA ? (
                        <span className={cn("text-[6px]", getQuarterColor(metaA.quarter))}>
                          {metaA.playerNumber}
                        </span>
                      ) : (
                        <span className="text-transparent">.</span>
                      )}
                    </div>
                    <div
                      className={cn(
                        "flex flex-1 items-center justify-center border-r border-black bg-white",
                        bottomA
                      )}
                    >
                      {renderScore(metaA, qEndA.has(point))}
                    </div>
                    <div
                      className={cn(
                        "flex flex-1 items-center justify-center border-r border-black",
                        bottomB
                      )}
                      style={{ backgroundColor: RUNNING_SCORE_TEAM_B_BG }}
                    >
                      {renderScore(metaB, qEndB.has(point))}
                    </div>
                    <div
                      className={cn(
                        "flex w-[22%] items-center justify-center font-mono",
                        bottomB
                      )}
                      style={{ backgroundColor: RUNNING_SCORE_TEAM_B_BG }}
                    >
                      {metaB?.hideJerseyAndScore ? (
                        <span className="select-none" />
                      ) : metaB?.circleJersey ? (
                        <span
                          className={cn(
                            "inline-flex min-h-[10px] min-w-[10px] items-center justify-center rounded-full border border-current font-mono text-[6px] font-bold",
                            getQuarterColor(metaB.quarter)
                          )}
                        >
                          {metaB.playerNumber}
                        </span>
                      ) : metaB ? (
                        <span className={cn("text-[6px]", getQuarterColor(metaB.quarter))}>
                          {metaB.playerNumber}
                        </span>
                      ) : (
                        <span className="text-transparent">.</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* タイムアウト・チームファウル */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="border border-black p-2">
          <div className="font-bold mb-1">タイムアウト</div>
          <div className="grid grid-cols-2 gap-2 text-[8px]">
            <div>
              <span className="font-bold">チームA:</span>
              <div className="mt-0.5">
                <div>前半(1Q,2Q): {getTimeoutCount("A", 0)}/2</div>
                <div>後半(3Q,4Q): {getTimeoutCount("A", 1)}/3</div>
                <div className="text-[7px] text-gray-600">{getTimeoutDetails("A")}</div>
              </div>
            </div>
            <div>
              <span className="font-bold">チームB:</span>
              <div className="mt-0.5">
                <div>前半(1Q,2Q): {getTimeoutCount("B", 0)}/2</div>
                <div>後半(3Q,4Q): {getTimeoutCount("B", 1)}/3</div>
                <div className="text-[7px] text-gray-600">{getTimeoutDetails("B")}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="border border-black p-2">
          <div className="font-bold mb-1">チームファウル</div>
          <div className="grid grid-cols-2 gap-2 text-[8px]">
            <div>
              <span className="font-bold">チームA:</span>
              <div className="flex gap-1 mt-0.5">
                {[0, 1, 2, 3].map(q => (
                  <span key={q}>Q{q+1}: {state.teamA.teamFouls[q]?.[0] || 0}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="font-bold">チームB:</span>
              <div className="flex gap-1 mt-0.5">
                {[0, 1, 2, 3].map(q => (
                  <span key={q}>Q{q+1}: {state.teamB.teamFouls[q]?.[0] || 0}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* スコアサマリー */}
      <div className="border border-black mb-2">
        <table className="w-full text-center">
          <thead>
            <tr className="bg-gray-200">
              <th className="border-r border-black p-1">チーム</th>
              <th className="border-r border-black p-1">1Q</th>
              <th className="border-r border-black p-1">2Q</th>
              <th className="border-r border-black p-1">前半</th>
              <th className="border-r border-black p-1">3Q</th>
              <th className="border-r border-black p-1">4Q</th>
              <th className="border-r border-black p-1">後半</th>
              <th className="border-r border-black p-1">OT</th>
              <th className="p-1 font-bold">合計</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-black">
              <td className="border-r border-black p-1 font-bold">{state.teamA.name || "A"}</td>
              <td className="border-r border-black p-1">{getQuarterScore("A", 1)}</td>
              <td className="border-r border-black p-1">{getQuarterScore("A", 2)}</td>
              <td className="border-r border-black p-1 bg-gray-100">{getQuarterScore("A", 1) + getQuarterScore("A", 2)}</td>
              <td className="border-r border-black p-1">{getQuarterScore("A", 3)}</td>
              <td className="border-r border-black p-1">{getQuarterScore("A", 4)}</td>
              <td className="border-r border-black p-1 bg-gray-100">{getQuarterScore("A", 3) + getQuarterScore("A", 4)}</td>
              <td className="border-r border-black p-1">{getQuarterScore("A", 5)}</td>
              <td className="p-1 font-bold text-lg">{totalScoreA}</td>
            </tr>
            <tr className="border-t border-black">
              <td className="border-r border-black p-1 font-bold">{state.teamB.name || "B"}</td>
              <td className="border-r border-black p-1">{getQuarterScore("B", 1)}</td>
              <td className="border-r border-black p-1">{getQuarterScore("B", 2)}</td>
              <td className="border-r border-black p-1 bg-gray-100">{getQuarterScore("B", 1) + getQuarterScore("B", 2)}</td>
              <td className="border-r border-black p-1">{getQuarterScore("B", 3)}</td>
              <td className="border-r border-black p-1">{getQuarterScore("B", 4)}</td>
              <td className="border-r border-black p-1 bg-gray-100">{getQuarterScore("B", 3) + getQuarterScore("B", 4)}</td>
              <td className="border-r border-black p-1">{getQuarterScore("B", 5)}</td>
              <td className="p-1 font-bold text-lg">{totalScoreB}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 審判・オフィシャルズ */}
      <div className="border border-black p-2 text-[8px]">
        <div className="grid grid-cols-4 gap-2">
          <div><span className="font-bold">クルーチーフ: </span>{state.officials.crewChief}</div>
          <div><span className="font-bold">アンパイア1: </span>{state.officials.umpire1}</div>
          <div><span className="font-bold">アンパイア2: </span>{state.officials.umpire2}</div>
          <div><span className="font-bold">スコアラー: </span>{state.officials.scorer}</div>
          <div><span className="font-bold">Aスコアラー: </span>{state.officials.assistantScorer}</div>
          <div><span className="font-bold">タイマー: </span>{state.officials.timer}</div>
          <div><span className="font-bold">24秒: </span>{state.officials.shotClockOperator}</div>
        </div>
      </div>

      {/* 勝者 */}
      <div className="mt-2 text-center font-bold text-sm border-2 border-black p-2">
        勝者: {state.winner === "A" ? state.teamA.name || "チームA" : state.winner === "B" ? state.teamB.name || "チームB" : "―"}
        {state.winner && (
          <span className="ml-4">
            最終スコア: {totalScoreA} - {totalScoreB}
          </span>
        )}
      </div>
    </div>
  )
}
