import { describe, expect, test } from "bun:test";

import type { RepoNodePayload } from "../github/schema";

import { toReposData } from "./repos";

function repoOf(name: string, stars: number, pushedAt: string): RepoNodePayload {
  return {
    description: "",
    forkCount: 0,
    isArchived: false,
    languages: { edges: [] },
    name,
    primaryLanguage: { color: "", name: "" },
    pushedAt,
    stargazerCount: stars,
  };
}

describe("toReposData", () => {
  test("スター降順、同点は push の新しい順に並べる", () => {
    const data = toReposData(
      [
        repoOf("old-popular", 10, "2024-01-01T00:00:00Z"),
        repoOf("new-popular", 10, "2026-01-01T00:00:00Z"),
        repoOf("small", 1, "2026-05-01T00:00:00Z"),
      ],
      "octocat",
    );
    expect(data.items.map((item) => item.name)).toEqual(["new-popular", "old-popular", "small"]);
  });

  test("URL と主言語を写す", () => {
    const data = toReposData([repoOf("repo", 1, "2026-01-01T00:00:00Z")], "octocat");
    expect(data.items[0]?.url).toBe("https://github.com/octocat/repo");
  });

  test("上限 10 件で切る", () => {
    const repos: RepoNodePayload[] = Array.from({ length: 12 }, (_unused, index) =>
      repoOf(`repo-${String(index)}`, index, "2026-01-01T00:00:00Z"),
    );
    expect(toReposData(repos, "octocat").items.length).toBe(10);
  });
});
