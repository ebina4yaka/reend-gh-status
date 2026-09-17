import type { RankScore } from "@/shared/github";

/**
 * ランクの算出。github-readme-stats と同じ考え方で、中央値を基準に
 * 各指標を飽和させて重み付き和を取る。
 */

interface RankInput {
  readonly commits: number;
  readonly issues: number;
  readonly pullRequests: number;
  readonly stars: number;
}

const COMMITS_MEDIAN: number = 1000;
const COMMITS_WEIGHT: number = 2;
const PRS_MEDIAN: number = 50;
const PRS_WEIGHT: number = 3;
const ISSUES_MEDIAN: number = 25;
const ISSUES_WEIGHT: number = 1;
const STARS_MEDIAN: number = 50;
const STARS_WEIGHT: number = 4;
const TOTAL_WEIGHT: number = COMMITS_WEIGHT + PRS_WEIGHT + ISSUES_WEIGHT + STARS_WEIGHT;

/** 中央値で 63% まで立ち上がる飽和カーブ。 */
function saturation(value: number, median: number): number {
  return value <= 0 ? 0 : 1 - Math.exp(-value / median);
}

function gradeOf(percentile: number): string {
  if (percentile <= 5) {
    return "S";
  }
  if (percentile <= 15) {
    return "A+";
  }
  if (percentile <= 30) {
    return "A";
  }
  if (percentile <= 50) {
    return "B+";
  }
  if (percentile <= 70) {
    return "B";
  }
  if (percentile <= 85) {
    return "C+";
  }
  return "C";
}

export function computeRank(input: RankInput): RankScore {
  const score: number =
    (COMMITS_WEIGHT * saturation(input.commits, COMMITS_MEDIAN) +
      PRS_WEIGHT * saturation(input.pullRequests, PRS_MEDIAN) +
      ISSUES_WEIGHT * saturation(input.issues, ISSUES_MEDIAN) +
      STARS_WEIGHT * saturation(input.stars, STARS_MEDIAN)) /
    TOTAL_WEIGHT;
  const percentile: number = Math.min(100, Math.max(0, (1 - score) * 100));
  return { grade: gradeOf(percentile), percentile };
}
