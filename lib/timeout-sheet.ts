/** 公式スコアシート用: クォーター長（分）の選択肢 */
export const QUARTER_LENGTH_OPTIONS = [5, 6, 8, 10] as const

export type QuarterLengthOption = (typeof QUARTER_LENGTH_OPTIONS)[number]

export function normalizeQuarterMinutes(value: number): QuarterLengthOption {
  if (QUARTER_LENGTH_OPTIONS.includes(value as QuarterLengthOption)) {
    return value as QuarterLengthOption
  }
  return 8
}

/**
 * コロ上の残り時間から、スコアシートに書く「経過した分数」（整数・分単位）を求める。
 * 例: 10分ピリオドで残り4:00 → 経過6分 → 6
 */
export function remainingClockToElapsedMinutesInteger(
  quarterLengthMinutes: number,
  remainingMinutes: number,
  remainingExtraSeconds: 0 | 30 = 0
): number {
  const qSec = Math.max(0, quarterLengthMinutes) * 60
  const rSec = Math.max(0, remainingMinutes) * 60 + remainingExtraSeconds
  const elapsedSec = Math.max(0, qSec - rSec)
  return Math.floor(elapsedSec / 60)
}

/** 記録セルに保存する文字列（整数の経過分） */
export function formatElapsedMinutesForTimeoutCell(
  quarterLengthMinutes: number,
  remainingMinutes: number,
  remainingExtraSeconds: 0 | 30 = 0
): string {
  return String(
    remainingClockToElapsedMinutesInteger(quarterLengthMinutes, remainingMinutes, remainingExtraSeconds)
  )
}
