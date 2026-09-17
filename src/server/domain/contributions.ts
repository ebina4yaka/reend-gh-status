import type { ContributionDayPayload, ContributionsCollectionPayload } from "../github/schema";
import type { ContributionDay, ContributionLevel, ContributionsData } from "@/shared/github";

/**
 * 草（contributionCalendar）からストリークと合計を求める純関数。
 * GitHub の曜日区切りは週の配列をそのまま時系列として扱う。
 */

const LEVELS: Readonly<Record<string, ContributionLevel>> = {
  FIRST_QUARTILE: 1,
  FOURTH_QUARTILE: 4,
  NONE: 0,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
};

function toLevel(name: string): ContributionLevel {
  return LEVELS[name] ?? 0;
}

type Weeks = ContributionsCollectionPayload["contributionCalendar"]["weeks"];

function flattenDays(weeks: Weeks): ContributionDay[] {
  return weeks.flatMap((week) =>
    week.contributionDays.map((day: ContributionDayPayload): ContributionDay => ({
      count: day.contributionCount,
      date: day.date,
      level: toLevel(day.contributionLevel),
    })),
  );
}

interface CurrentStreakAcc {
  readonly current: number;
  readonly last: string;
  readonly skippedToday: boolean;
  readonly stop: boolean;
}

const CURRENT_INITIAL: CurrentStreakAcc = {
  current: 0,
  last: "",
  skippedToday: false,
  stop: false,
};

/**
 * 現在ストリーク。最終日が 0 でもその日はまだ終わっていない可能性があるため、
 * 最終日の 0 だけは読み飛ばして前日から数える。
 */
function currentStreak(days: readonly ContributionDay[]): { current: number; last: string } {
  const result: CurrentStreakAcc = [...days]
    .toReversed()
    .reduce((acc: CurrentStreakAcc, day: ContributionDay, index: number): CurrentStreakAcc => {
      if (acc.stop) {
        return acc;
      }
      if (day.count > 0) {
        return {
          ...acc,
          current: acc.current + 1,
          last: acc.last === "" ? day.date : acc.last,
        };
      }
      if (index === 0 && !acc.skippedToday) {
        return { ...acc, skippedToday: true };
      }
      return { ...acc, stop: true };
    }, CURRENT_INITIAL);
  return { current: result.current, last: result.last };
}

interface LongestAcc {
  readonly longest: number;
  readonly running: number;
}

function longestStreak(days: readonly ContributionDay[]): number {
  return days.reduce(
    (acc: LongestAcc, day: ContributionDay): LongestAcc =>
      day.count > 0
        ? { longest: Math.max(acc.longest, acc.running + 1), running: acc.running + 1 }
        : { longest: acc.longest, running: 0 },
    { longest: 0, running: 0 },
  ).longest;
}

export function toContributionsData(collection: ContributionsCollectionPayload): ContributionsData {
  const days: ContributionDay[] = flattenDays(collection.contributionCalendar.weeks);
  const current: { current: number; last: string } = currentStreak(days);
  return {
    currentStreak: current.current,
    lastContributedOn: current.last,
    longestStreak: longestStreak(days),
    totalContributions: collection.contributionCalendar.totalContributions,
    weeks: collection.contributionCalendar.weeks.map((week) =>
      week.contributionDays.map((day) => ({
        count: day.contributionCount,
        date: day.date,
        level: toLevel(day.contributionLevel),
      })),
    ),
  };
}
