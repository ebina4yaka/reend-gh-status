import { describe, expect, test } from "bun:test";

import type { ContributionsCollectionPayload } from "../github/schema";

import { toContributionsData } from "./contributions";

/** テスト用に週の配列を組み立てる（各週 7 日、counts の並びで与える）。 */
function collectionOf(weekCounts: readonly (readonly number[])[]): ContributionsCollectionPayload {
  return {
    contributionCalendar: {
      totalContributions: weekCounts.flat().reduce((sum: number, count: number) => sum + count, 0),
      weeks: weekCounts.map((counts, weekIndex) => ({
        contributionDays: counts.map((count, dayIndex) => ({
          contributionCount: count,
          contributionLevel: count === 0 ? "NONE" : "FIRST_QUARTILE",
          date: `2026-01-${String(weekIndex * 7 + dayIndex + 1).padStart(2, "0")}`,
        })),
      })),
    },
    restrictedContributionsCount: 0,
    totalCommitContributions: 10,
    totalIssueContributions: 0,
    totalPullRequestContributions: 0,
    totalPullRequestReviewContributions: 0,
  };
}

describe("toContributionsData", () => {
  test("連続した日を longest / current として数える", () => {
    const data = toContributionsData(
      collectionOf([
        [1, 1, 1],
        [0, 1, 0],
        [1, 1, 1],
      ]),
    );
    expect(data.longestStreak).toBe(3);
    expect(data.currentStreak).toBe(3);
    expect(data.lastContributedOn).toBe("2026-01-17");
  });

  test("最終日が 0 でも、その日はまだ終わっていない前提でストリークを切らない", () => {
    const data = toContributionsData(collectionOf([[1, 1, 1, 0]]));
    expect(data.currentStreak).toBe(3);
    expect(data.lastContributedOn).toBe("2026-01-03");
  });

  test("2 日以上空くと current は止まる", () => {
    const data = toContributionsData(collectionOf([[1, 1, 0, 0]]));
    expect(data.currentStreak).toBe(0);
    expect(data.longestStreak).toBe(2);
  });

  test("草の総数はカレンダーの値をそのまま使う", () => {
    const data = toContributionsData(collectionOf([[1, 2, 3]]));
    expect(data.totalContributions).toBe(6);
  });
});
