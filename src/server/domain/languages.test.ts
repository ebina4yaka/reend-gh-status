import { describe, expect, test } from "bun:test";

import type { RepoNodePayload } from "../github/schema";

import { aggregateLanguages } from "./languages";

function repoOf(
  name: string,
  languages: readonly (readonly [string, number, string])[],
): RepoNodePayload {
  return {
    description: "",
    forkCount: 0,
    isArchived: false,
    languages: {
      edges: languages.map(([language, size, color]) => ({
        node: { color, name: language },
        size,
      })),
    },
    name,
    primaryLanguage: { color: "", name: "" },
    pushedAt: "2026-01-01T00:00:00Z",
    stargazerCount: 0,
  };
}

describe("aggregateLanguages", () => {
  test("リポジトリをまたいでバイト数を合算し、割合を出す", () => {
    const data = aggregateLanguages([
      repoOf("a", [["TypeScript", 300, "#3178c6"]]),
      repoOf("b", [
        ["TypeScript", 100, "#3178c6"],
        ["Rust", 100, "#dea584"],
      ]),
    ]);
    expect(data.items[0]).toEqual({
      bytes: 400,
      color: "#3178c6",
      name: "TypeScript",
      percent: 80,
    });
    expect(data.items[1]?.name).toBe("Rust");
  });

  test("言語が無ければ空を返す", () => {
    const data = aggregateLanguages([repoOf("empty", [])]);
    expect(data.items).toEqual([]);
  });
});
