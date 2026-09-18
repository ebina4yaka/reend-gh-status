import { afterEach, describe, expect, test } from "bun:test";

import { fixtureSnapshot } from "@/server/github/fixture";

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

function stubJson(body: Record<string, unknown>): void {
  globalThis.fetch = ((): Promise<Response> =>
    Promise.resolve(Response.json(body))) as unknown as typeof fetch;
}

describe("api client", () => {
  test("日付は Date ではなく ISO 文字列で届く", async () => {
    stubJson({
      data: fixtureSnapshot(),
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
