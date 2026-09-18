import type { LanguageStat } from "@/shared/github";

/**
 * ドーナツチャートの幾何計算。satori は conic-gradient を解釈しないため、
 * 円弧を扇形の polygon へ近似して clip-path で切り出す。
 * （太い border の円を扇形にクリップすると、ドーナツの 1 セグメントになる）
 */

export const DONUT_SIZE: number = 116;
const DONUT_THICKNESS: number = 15;
/** セグメント間に空ける角度（度）。 */
export const DONUT_GAP_DEGREES: number = 1.6;
export const DONUT_MAX_SLICES: number = 5;

export interface Wedge {
  readonly color: string;
  /** 終了角（度、12 時方向を 0 として時計回り）。 */
  readonly end: number;
  /** 開始角（度）。 */
  readonly start: number;
}

/**
 * 扇形を多角形へ近似する。中心から円の外側（半径 = 直径）まで放射状に点を取り、
 * 円弧側は 15 度刻みで置き換える。弦の落ち込みは円の半径では無視できる。
 */
export function wedgePolygon(start: number, end: number): string {
  const center: number = DONUT_SIZE / 2;
  const radius: number = DONUT_SIZE;
  const steps: number = Math.max(2, Math.ceil((end - start) / 15));
  const arcPoints: string[] = Array.from({ length: steps + 1 }, (_unused, index) => {
    const angle: number = start + ((end - start) * index) / steps;
    const radians: number = ((angle - 90) * Math.PI) / 180;
    const x: number = center + radius * Math.cos(radians);
    const y: number = center + radius * Math.sin(radians);
    return `${x.toFixed(2)}px ${y.toFixed(2)}px`;
  });
  return `polygon(${`${center}px ${center}px`}, ${arcPoints.join(", ")})`;
}

function colorOf(item: LanguageStat, fallback: readonly string[], index: number): string {
  if (item.color !== "") {
    return item.color;
  }
  return fallback[index % fallback.length] ?? "#888";
}

/** 上位 5 言語の扇形を積み上げる。残りは背景リングのまま残す。 */
export function buildWedges(
  items: readonly LanguageStat[],
  fallback: readonly string[],
): readonly Wedge[] {
  const top: readonly LanguageStat[] = items.slice(0, DONUT_MAX_SLICES);
  return top.map((item: LanguageStat, index: number): Wedge => {
    const before: number = top
      .slice(0, index)
      .reduce((sum: number, entry: LanguageStat) => sum + entry.percent, 0);
    const start: number = before * 3.6 + DONUT_GAP_DEGREES / 2;
    const span: number = Math.max(0.5, item.percent * 3.6 - DONUT_GAP_DEGREES);
    return { color: colorOf(item, fallback, index), end: start + span, start };
  });
}

/**
 * リング 1 本分の radial-gradient を作る。satori は border へ clip-path を
 * 適用しないため、扇形は「塗りつぶした円を clip-path で切る」のではなく
 * 「リング状のグラデーションを clip-path で切る」方式にする。
 * 中央は透明のまま残る。
 */
export function ringGradient(
  ringColor: string,
  size: number = DONUT_SIZE,
  thickness: number = DONUT_THICKNESS,
): string {
  const center: number = size / 2;
  const inner: number = center - thickness;
  return [
    "radial-gradient(circle",
    "rgba(0,0,0,0) 0px",
    `rgba(0,0,0,0) ${inner.toFixed(1)}px`,
    `${ringColor} ${(inner + 1).toFixed(1)}px`,
    `${ringColor} ${center.toFixed(1)}px`,
    `rgba(0,0,0,0) ${(center + 1).toFixed(1)}px)`,
  ].join(", ");
}

/** 上位 5 言語の割合の合計から、残りの割合を求める。 */
export function remainderPercent(items: readonly LanguageStat[]): number {
  const shown: number = items
    .slice(0, DONUT_MAX_SLICES)
    .reduce((sum: number, item: LanguageStat) => sum + item.percent, 0);
  return Math.max(0, 100 - shown);
}
