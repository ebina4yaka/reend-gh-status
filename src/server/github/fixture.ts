import type { GithubSnapshot } from "@/shared/github";

/**
 * テストとローカル確認用のサンプルスナップショット。
 * GitHub API を叩かずにカードと変換ロジックを検証するために使う。
 */
export function fixtureSnapshot(): GithubSnapshot {
  return {
    activity: {
      items: [
        {
          count: 3,
          createdAt: "2026-09-16T09:12:00Z",
          id: "ev-1",
          kind: "commit",
          repo: "octocat/hello-world",
          title: "Pushed 3 commits to main",
          url: "https://github.com/octocat/hello-world",
        },
        {
          count: 1,
          createdAt: "2026-09-15T22:41:00Z",
          id: "ev-2",
          kind: "pull-request",
          repo: "octocat/hello-world",
          title: "Fix HUD corner brackets on small cards",
          url: "https://github.com/octocat/hello-world/pull/42",
        },
        {
          count: 1,
          createdAt: "2026-09-14T08:03:00Z",
          id: "ev-3",
          kind: "release",
          repo: "octocat/reend-status",
          title: "v0.2.0",
          url: "https://github.com/octocat/reend-status/releases/tag/v0.2.0",
        },
        {
          count: 1,
          createdAt: "2026-09-12T17:25:00Z",
          id: "ev-4",
          kind: "issue",
          repo: "octocat/reend-status",
          title: "Rate limit が 403 で返る",
          url: "https://github.com/octocat/reend-status/issues/7",
        },
        {
          count: 2,
          createdAt: "2026-09-10T11:00:00Z",
          id: "ev-5",
          kind: "commit",
          repo: "octocat/terminal-ui",
          title: "Pushed 2 commits to develop",
          url: "https://github.com/octocat/terminal-ui",
        },
      ],
    },
    contributions: {
      currentStreak: 12,
      lastContributedOn: "2026-09-17",
      longestStreak: 48,
      totalContributions: 1620,
      weeks: buildFixtureWeeks(),
    },
    languages: {
      items: [
        { bytes: 482_100, color: "#3178c6", name: "TypeScript", percent: 54.2 },
        { bytes: 190_400, color: "#f1e05a", name: "JavaScript", percent: 21.4 },
        { bytes: 88_200, color: "#dea584", name: "Rust", percent: 9.9 },
        { bytes: 61_300, color: "#e34c26", name: "HTML", percent: 6.9 },
        { bytes: 42_000, color: "#563d7c", name: "CSS", percent: 4.7 },
      ],
      totalBytes: 889_000,
    },
    repos: {
      items: [
        {
          description: "A HUD-styled GitHub statistics terminal.",
          forks: 34,
          isArchived: false,
          language: "TypeScript",
          languageColor: "#3178c6",
          name: "reend-status",
          pushedAt: "2026-09-17T10:00:00Z",
          stars: 5120,
          url: "https://github.com/octocat/reend-status",
        },
        {
          description: "Tactical React components for dashboards.",
          forks: 12,
          isArchived: false,
          language: "TypeScript",
          languageColor: "#3178c6",
          name: "terminal-ui",
          pushedAt: "2026-09-10T08:30:00Z",
          stars: 980,
          url: "https://github.com/octocat/terminal-ui",
        },
        {
          description: "WASM experiments for edge rendering.",
          forks: 3,
          isArchived: false,
          language: "Rust",
          languageColor: "#dea584",
          name: "edge-render",
          pushedAt: "2026-08-30T20:15:00Z",
          stars: 240,
          url: "https://github.com/octocat/edge-render",
        },
        {
          description: "Legacy scripts kept for reference.",
          forks: 0,
          isArchived: true,
          language: "Shell",
          languageColor: "#89e051",
          name: "dotfiles",
          pushedAt: "2024-01-01T00:00:00Z",
          stars: 12,
          url: "https://github.com/octocat/dotfiles",
        },
      ],
    },
    stats: {
      commits: 4821,
      followers: 123,
      following: 45,
      identity: { avatarUrl: "", login: "octocat", name: "The Octocat" },
      issues: 210,
      mergedPullRequests: 340,
      pullRequests: 402,
      rank: { grade: "A+", percentile: 8.4 },
      repositories: 57,
      stars: 12_480,
    },
  };
}

/** 53 週分の草を決定的に生成する（テストのスナップショットを安定させる）。 */
function buildFixtureWeeks(): readonly (readonly {
  count: number;
  date: string;
  level: 0 | 1 | 2 | 3 | 4;
}[])[] {
  const levels: readonly (0 | 1 | 2 | 3 | 4)[] = [0, 1, 2, 3, 4];
  const startMs: number = Date.UTC(2025, 8, 1);
  const dayMs: number = 24 * 60 * 60 * 1000;
  return Array.from({ length: 53 }, (_week, weekIndex) =>
    Array.from({ length: 7 }, (_day, dayIndex) => {
      const level: 0 | 1 | 2 | 3 | 4 = levels[(weekIndex * 3 + dayIndex * 5) % 5] ?? 0;
      const date: string = new Date(startMs + (weekIndex * 7 + dayIndex) * dayMs)
        .toISOString()
        .slice(0, 10);
      return {
        count: level * 2,
        date,
        level,
      };
    }),
  );
}
