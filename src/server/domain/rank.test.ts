import { describe, expect, test } from "bun:test";

import { computeRank } from "./rank";

describe("computeRank", () => {
  test("実績が増えると順位が上がる（percentile が下がる）", () => {
    const low = computeRank({ commits: 10, issues: 1, pullRequests: 1, stars: 1 });
    const high = computeRank({
      commits: 5000,
      issues: 300,
      pullRequests: 500,
      stars: 4000,
    });
    expect(high.percentile).toBeLessThan(low.percentile);
  });

  test("実績が十分大きいと S になる", () => {
    const rank = computeRank({
      commits: 20_000,
      issues: 2000,
      pullRequests: 3000,
      stars: 30_000,
    });
    expect(rank.grade).toBe("S");
  });

  test("実績が無くても 0〜100 の範囲に収まる", () => {
    const rank = computeRank({ commits: 0, issues: 0, pullRequests: 0, stars: 0 });
    expect(rank.percentile).toBe(100);
    expect(rank.grade).toBe("C");
  });
});
