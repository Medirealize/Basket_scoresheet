import type { FoulRecord } from "@/lib/score-context"

/** ファウル列の Q 切り替わり直前の区切り種別（2Q→3Q は黒太線） */
export type FoulQuarterGap = "none" | "thick-black" | "thin"

export function foulQuarterGapBefore(fouls: FoulRecord[], foulIndex: number): FoulQuarterGap {
  if (foulIndex === 0) return "none"
  const prev = Number(fouls[foulIndex - 1].quarter)
  const cur = Number(fouls[foulIndex].quarter)
  if (prev === cur) return "none"
  if (prev === 2 && cur === 3) return "thick-black"
  return "thin"
}

/** 選手タブ用ファウルバッジ（塗り＋枠で視認性を確保） */
export function foulBadgeClassList(quarter: number, foulType: string): string {
  const q = Number(quarter)
  const isDest = foulType.startsWith("U") || foulType === "D"
  if (isDest) {
    return [
      "inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-md border-2 px-2 py-0.5",
      "border-red-900 bg-red-600 text-sm font-bold text-white shadow-sm",
    ].join(" ")
  }
  if (q === 1) {
    return [
      "inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-md border-2 px-2 py-0.5",
      "border-red-700 bg-red-100 text-sm font-bold text-red-950 shadow-sm",
    ].join(" ")
  }
  if (q === 2) {
    return [
      "inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-md border-2 px-2 py-0.5",
      "border-zinc-800 bg-zinc-200 text-sm font-bold text-zinc-950 shadow-sm",
    ].join(" ")
  }
  if (q === 3) {
    return [
      "inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-md border-2 px-2 py-0.5",
      "border-red-800 bg-rose-100 text-sm font-bold text-red-950 shadow-sm",
    ].join(" ")
  }
  if (q === 4) {
    return [
      "inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-md border-2 px-2 py-0.5",
      "border-black bg-neutral-100 text-sm font-bold text-neutral-950 shadow-sm",
    ].join(" ")
  }
  return [
    "inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-md border-2 px-2 py-0.5",
    "border-amber-800 bg-amber-100 text-sm font-bold text-amber-950 shadow-sm",
  ].join(" ")
}

/** 印刷用（小さめ） */
export function foulBadgeClassListPrint(quarter: number, foulType: string): string {
  const q = Number(quarter)
  const isDest = foulType.startsWith("U") || foulType === "D"
  if (isDest) {
    return "inline-block rounded border border-red-900 bg-red-600 px-0.5 font-bold text-white"
  }
  if (q === 1) return "inline-block rounded border border-red-700 bg-red-100 px-0.5 font-bold text-red-950"
  if (q === 2) return "inline-block rounded border border-zinc-800 bg-zinc-200 px-0.5 font-bold text-zinc-950"
  if (q === 3) return "inline-block rounded border border-red-800 bg-rose-100 px-0.5 font-bold text-red-950"
  if (q === 4) return "inline-block rounded border border-black bg-neutral-100 px-0.5 font-bold text-black"
  return "inline-block rounded border border-amber-800 bg-amber-100 px-0.5 font-bold text-amber-950"
}
