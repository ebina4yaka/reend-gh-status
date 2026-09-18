import { describe, expect, test } from "bun:test";

import type { LanguageStat } from "@/shared/github";

import {
  DONUT_GAP_DEGREES,
  DONUT_MAX_SLICES,
  buildWedges,
  remainderPercent,
  wedgePolygon,
} from "./donut";

function langOf(name: string, percent: number, color: string = "#123456"): LanguageStat {
  return { bytes: Math.round(percent * 10), color, name, percent };
}

describe("buildWedges", () => {
  test("上位 5 言語だけを扇形にする", () => {
    const items: LanguageStat[] = Array.from({ length: 7 }, (_unused, index) =>
      langOf(`lang-${String(index)}`, 10),
    );
    expect(buildWedges(items, ["#fallback"]).length).toBe(DONUT_MAX_SLICES);
  });

  test("角度は時計回りに増え、セグメント間に隙間が空く", () => {
    const wedges = buildWedges([langOf("a", 50), langOf("b", 50)], ["#fallback"]);
    expect(wedges[0]?.start).toBeCloseTo(DONUT_GAP_DEGREES / 2, 5);
    expect(wedges[0]?.end).toBeCloseTo(50 * 3.6 - DONUT_GAP_DEGREES / 2, 5);
    expect(wedges[1]?.start).toBeGreaterThan(wedges[0]?.end ?? 0);
  });

  test("色が無い言語は代替色を使う", () => {
    const wedges = buildWedges([langOf("a", 100, "")], ["#fallback"]);
    expect(wedges[0]?.color).toBe("#fallback");
  });

  test("極端に小さい割合でも最低 0.5 度を確保する", () => {
    const wedges = buildWedges([langOf("a", 0.01)], ["#fallback"]);
    expect((wedges[0]?.end ?? 0) - (wedges[0]?.start ?? 0)).toBeGreaterThanOrEqual(0.5);
  });
});

describe("wedgePolygon", () => {
  test("中心から始まる polygon を返す", () => {
    const polygon: string = wedgePolygon(0, 90);
    expect(polygon.startsWith("polygon(58px 58px, ")).toBe(true);
    expect(polygon.endsWith(")")).toBe(true);
    // 90 度は 15 度刻みで 6 + 1 点（中心を除く）。
    expect(polygon.split(",").length).toBe(8);
  });

  test("始点は真上、90 度は右を向く", () => {
    const polygon: string = wedgePolygon(0, 90);
    expect(polygon).toContain("58.00px -58.00px");
    expect(polygon).toContain("174.00px 58.00px");
  });
});

describe("remainderPercent", () => {
  test("上位 5 言語の合計を 100 から引く", () => {
    expect(remainderPercent([langOf("a", 60), langOf("b", 30)])).toBeCloseTo(10, 5);
  });

  test("100 を超えても負にならない", () => {
    expect(remainderPercent([langOf("a", 120)])).toBe(0);
  });
});
