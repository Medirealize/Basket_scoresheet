import type { ScoreEntry } from "@/lib/score-context"

/** 公式スコアシートに近い B側得点列の背景色 */
export const RUNNING_SCORE_TEAM_B_BG = "#FFDAB9"

/** 各クォーターでそのチームの最終累計得点（ランニングの行番号） */
export function lastRunningScoreByQuarter(entries: ScoreEntry[], team: "A" | "B"): Map<number, number> {
  const m = new Map<number, number>()
  for (const e of entries) {
    if (e.team !== team) continue
    const prev = m.get(e.quarter)
    if (prev === undefined || e.totalScore >= prev) m.set(e.quarter, e.totalScore)
  }
  return m
}

/** ランニングの「その累計点」に対応する得点記録（2P/3Pの中間点も含む） */
export function getRunningCellMeta(
  entries: ScoreEntry[],
  team: "A" | "B",
  point: number
): {
  quarter: number
  playerNumber: string
  /** 2Pの1点目・3Pの1〜2点目: 得点列・背番号列とも空欄 */
  hideJerseyAndScore: boolean
  /** 2P/3Pの成立点のみ得点列に／ */
  showSlash: boolean
  /** FT および 1点記録の得点列（塗り丸） */
  showFilledCircle: boolean
  /** 3P成立時のみ: 背番号に丸（得点列の丸は付けない） */
  circleJersey: boolean
} | null {
  for (const e of entries) {
    if (e.team !== team) continue
    const pts = Number(e.points)
    const total = Number(e.totalScore)
    if (!Number.isFinite(pts) || pts < 1 || !Number.isFinite(total)) continue
    const start = total - pts + 1
    if (point < start || point > total) continue
    const i = point - start
    const isFinal = i === pts - 1
    const isIntermediate = pts >= 2 && i < pts - 1
    const isFt = e.isFreeThrow === true
    const hideJerseyAndScore = isIntermediate
    const showSlash = isFinal && !isFt && pts >= 2
    const circleJersey = isFinal && !isFt && pts === 3
    const showFilledCircle = isFinal && !hideJerseyAndScore && !showSlash
    return {
      quarter: e.quarter,
      playerNumber: e.playerNumber,
      hideJerseyAndScore,
      showSlash,
      showFilledCircle,
      circleJersey,
    }
  }
  return null
}

/** クォーター終了の太い横線を引く行（両チームのうち深い方） */
export function quarterSeparatorRows(entries: ScoreEntry[]): Set<number> {
  const lastA = lastRunningScoreByQuarter(entries, "A")
  const lastB = lastRunningScoreByQuarter(entries, "B")
  const s = new Set<number>()
  const maxQ = Math.max(5, ...entries.map((e) => e.quarter), 0)
  for (let q = 1; q <= maxQ; q++) {
    const a = lastA.get(q)
    const b = lastB.get(q)
    if (a === undefined && b === undefined) continue
    s.add(Math.max(a ?? 0, b ?? 0))
  }
  return s
}

/** Q間の太線: 1–2 赤、2–3 黒、3–4 赤、4 終了 黒二重。延長は黒太線。手動線はその行に自動線が無い列のみ黒太線 */
export type QuarterSeparatorLineStyle = "red-thick" | "black-thick" | "black-double"

function quarterSeparatorLineStyleForQuarterNumber(q: number): QuarterSeparatorLineStyle {
  if (q === 1 || q === 3) return "red-thick"
  if (q === 2) return "black-thick"
  if (q === 4) return "black-double"
  return "black-thick"
}

/** 指定チームの得点列だけに引くQ間太線（そのチームの各Q終了累計点の行） */
export function quarterSeparatorLineStylesForTeam(
  entries: ScoreEntry[],
  team: "A" | "B",
  manualLinePoints: readonly number[]
): Map<number, QuarterSeparatorLineStyle> {
  const lastByQ = lastRunningScoreByQuarter(entries, team)
  const map = new Map<number, QuarterSeparatorLineStyle>()
  const maxQ = Math.max(4, ...entries.map((e) => e.quarter), 0)

  for (let q = 1; q <= maxQ; q++) {
    const row = lastByQ.get(q)
    if (row === undefined || row < 1) continue
    map.set(row, quarterSeparatorLineStyleForQuarterNumber(q))
  }

  for (const p of manualLinePoints) {
    if (!map.has(p)) map.set(p, "black-thick")
  }
  return map
}

/** 画面用（combined-score-grid）の下線クラス */
export function quarterSeparatorBottomClassScreen(style: QuarterSeparatorLineStyle): string {
  switch (style) {
    case "red-thick":
      return "border-b-[3px] border-red-600"
    case "black-thick":
      return "border-b-[3px] border-black"
    case "black-double":
      return "border-b-4 border-double border-black"
  }
}

/** 印刷用の下線クラス */
export function quarterSeparatorBottomClassPrint(style: QuarterSeparatorLineStyle): string {
  switch (style) {
    case "red-thick":
      return "border-b-[2px] border-red-600"
    case "black-thick":
      return "border-b-[2px] border-black"
    case "black-double":
      return "border-b-2 border-double border-black"
  }
}
