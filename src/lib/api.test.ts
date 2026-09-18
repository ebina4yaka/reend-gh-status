import { afterEach, describe, expect, test } from "bun:test";

import { api } from "./api";

/**
 * Eden Treaty は既定で ISO 8601 文字列を Date へ復元する。
 * カード部品は日付を文字列として扱うため、クライアント設定で無効化して
 * いる（src/lib/api.ts の parseDate: false）。ここではその挙動を固定する。
 */

const originalFetch: typeof fetch = globalThis.fetch;

afterEach((): void => {
  globalThis.fetch = originalFetch;
});

function stubJson(body: object): void {
  globalThis.fetch = ((): Promise<Response> =>
    Promise.resolve(Response.json(body))) as unknown as typeof fetch;
}

describe("api client", () => {
  test("日付は Date ではなく ISO 文字列で届く", async () => {
    stubJson({
      data: {
        activity: { items: [] },
        contributions: {
          currentStreak: 0,
          lastContributedOn: "2026-09-17",
          longestStreak: 0,
          totalContributions: 0,
          weeks: [],
        },
        languages: { items: [], totalBytes: 0 },
        repos: {
          items: [
            {
              description: "",
              forks: 0,
              isArchived: false,
              language: "",
              languageColor: "",
              name: "repo",
              pushedAt: "2026-01-01T00:00:00.000Z",
              stars: 0,
              url: "https://github.com/octocat/repo",
            },
          ],
        },
        stats: {
          commits: 0,
          followers: 0,
          following: 0,
          identity: { avatarUrl: "", login: "octocat", name: "" },
          issues: 0,
          mergedPullRequests: 0,
          pullRequests: 0,
          rank: { grade: "C", percentile: 100 },
          repositories: 0,
          stars: 0,
        },
      },
      fetchedAt: "2026-09-18T00:00:00.000Z",
      status: "ok",
    });
    const response: Awaited<ReturnType<typeof api.api.snapshot.QUERY>> =
      await api.api.snapshot.QUERY({});
    expect(response.data?.status).toBe("ok");
    if (response.data?.status === "ok") {
      expect(typeof response.data.fetchedAt).toBe("string");
      expect(typeof response.data.data.repos.items[0]?.pushedAt).toBe("string");
    }
  });
});
