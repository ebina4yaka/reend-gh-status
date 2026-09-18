/**
 * GitHub データのドメイン型。サーバーの応答（ワイヤ形式）とカード部品が共用する。
 *
 * ワイヤ形式では Maybe を使わない（JSON へ素直に落とすため）。欠落は空文字や
 * 空配列で表し、欠落の扱いは各カードが決める。
 */

interface GithubIdentity {
  readonly avatarUrl: string;
  readonly login: string;
  readonly name: string;
}

export interface RankScore {
  /** S / A+ / A / B+ / B / C+ / C */
  readonly grade: string;
  /** 上位何 % か（0〜100）。 */
  readonly percentile: number;
}

export interface StatsData {
  readonly commits: number;
  readonly followers: number;
  readonly following: number;
  readonly identity: GithubIdentity;
  readonly issues: number;
  readonly mergedPullRequests: number;
  readonly pullRequests: number;
  readonly rank: RankScore;
  readonly repositories: number;
  readonly stars: number;
}

export interface LanguageStat {
  readonly bytes: number;
  readonly color: string;
  readonly name: string;
  /** 0〜100 の割合。 */
  readonly percent: number;
}

export interface TopLangsData {
  readonly items: readonly LanguageStat[];
  readonly totalBytes: number;
}

/** GitHub の草の濃さ（0=none, 1..4）。 */
export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface ContributionDay {
  readonly count: number;
  readonly date: string;
  readonly level: ContributionLevel;
}

export interface ContributionsData {
  readonly currentStreak: number;
  readonly lastContributedOn: string;
  readonly longestStreak: number;
  readonly totalContributions: number;
  /** 週ごとの日別カウント（contributionsCollection の calendar をそのまま写す）。 */
  readonly weeks: readonly (readonly ContributionDay[])[];
}

export type ActivityKind = "comment" | "commit" | "issue" | "pull-request" | "release" | "other";

export interface ActivityItem {
  readonly createdAt: string;
  /** 何件まとめたか（PushEvent のコミット数など）。 */
  readonly count: number;
  readonly id: string;
  readonly kind: ActivityKind;
  readonly repo: string;
  readonly title: string;
  readonly url: string;
}

export interface ActivityData {
  readonly items: readonly ActivityItem[];
}

export interface RepoItem {
  readonly description: string;
  readonly forks: number;
  readonly isArchived: boolean;
  readonly language: string;
  readonly languageColor: string;
  readonly name: string;
  readonly pushedAt: string;
  readonly stars: number;
  readonly url: string;
}

export interface ReposData {
  readonly items: readonly RepoItem[];
}

/** いずれかのカードのデータをまとめたもの（ダッシュボードの 1 回の取得で使う）。 */
export interface GithubSnapshot {
  readonly activity: ActivityData;
  readonly contributions: ContributionsData;
  readonly languages: TopLangsData;
  readonly repos: ReposData;
  readonly stats: StatsData;
}

export type ApiErrorReason = "github-error" | "missing-username" | "not-found" | "rate-limited";

export type ApiResponse<TData> =
  | { readonly data: TData; readonly fetchedAt: string; readonly status: "ok" }
  | { readonly message: string; readonly reason: ApiErrorReason; readonly status: "error" };

/** 空のスナップショット（Storybook の初期値とテストで使う）。 */
export function emptySnapshot(): GithubSnapshot {
  return {
    activity: { items: [] },
    contributions: {
      currentStreak: 0,
      lastContributedOn: "",
      longestStreak: 0,
      totalContributions: 0,
      weeks: [],
    },
    languages: { items: [], totalBytes: 0 },
    repos: { items: [] },
    stats: {
      commits: 0,
      followers: 0,
      following: 0,
      identity: { avatarUrl: "", login: "", name: "" },
      issues: 0,
      mergedPullRequests: 0,
      pullRequests: 0,
      rank: { grade: "C", percentile: 100 },
      repositories: 0,
      stars: 0,
    },
  };
}
