/**
 * GitHub API の応答形を模したテスト用フィクスチャ。
 * valibot スキーマの検証と、クライアントのエラー分岐の両方で使う。
 */

export function graphqlPayloadFixture(): object {
  const days = Array.from({ length: 14 }, (_unused, index) => ({
    contributionCount: index % 3,
    contributionLevel: index % 3 === 0 ? "NONE" : "SECOND_QUARTILE",
    date: `2026-09-${String(index + 1).padStart(2, "0")}`,
  }));
  return {
    data: {
      user: {
        avatarUrl: "https://avatars.example/u",
        contributionsCollection: {
          contributionCalendar: {
            totalContributions: 42,
            weeks: [
              { contributionDays: days.slice(0, 7) },
              { contributionDays: days.slice(7, 14) },
            ],
          },
          restrictedContributionsCount: 5,
          totalCommitContributions: 120,
          totalIssueContributions: 3,
          totalPullRequestContributions: 9,
          totalPullRequestReviewContributions: 2,
        },
        followers: { totalCount: 12 },
        following: { totalCount: 4 },
        issues: { totalCount: 30 },
        login: "octocat",
        mergedPullRequests: { totalCount: 8 },
        name: "The Octocat",
        repositories: {
          nodes: [
            {
              description: "A stats card",
              forkCount: 2,
              isArchived: false,
              languages: {
                edges: [
                  { node: { color: "#3178c6", name: "TypeScript" }, size: 300 },
                  { node: { color: "#dea584", name: "Rust" }, size: 100 },
                ],
              },
              name: "reend-status",
              primaryLanguage: { color: "#3178c6", name: "TypeScript" },
              pushedAt: "2026-09-10T00:00:00Z",
              stargazerCount: 128,
            },
          ],
          totalCount: 1,
        },
      },
    },
  };
}

export function eventsPayloadFixture(): object[] {
  return [
    {
      created_at: "2026-09-16T10:00:00Z",
      id: "ev-1",
      payload: { ref: "refs/heads/main", size: 2 },
      repo: { name: "octocat/reend-status" },
      type: "PushEvent",
    },
    {
      created_at: "2026-09-15T10:00:00Z",
      id: "ev-2",
      payload: { pull_request: { number: 3, title: "Add corner brackets" } },
      repo: { name: "octocat/reend-status" },
      type: "PullRequestEvent",
    },
    {
      created_at: "2026-09-14T10:00:00Z",
      id: "ev-3",
      payload: {},
      repo: { name: "octocat/reend-status" },
      type: "WatchEvent",
    },
  ];
}
