import { afterEach, describe, expect, test } from "bun:test";
import type { Result } from "true-myth";

import { type GithubFailure, fetchActivity, fetchCore, resolveUsername } from "./client";
import type { GithubEventPayload, GithubUserPayload } from "./schema";
import { eventsPayloadFixture, graphqlPayloadFixture } from "./payload-fixture";

/** テスト中だけ fetch を差し替える（実 API は叩かない）。 */
function stubFetch(handler: (url: string) => Response): () => void {
  const original: typeof fetch = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL): Promise<Response> =>
    Promise.resolve(handler(String(input)))) as typeof fetch;
  return (): void => {
    globalThis.fetch = original;
  };
}

const cleanups: (() => void)[] = [];

afterEach((): void => {
  for (const cleanup of cleanups.splice(0)) {
    cleanup();
  }
  delete process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_USERNAME;
});

function stubGraphql(payload: object, status: number = 200): void {
  cleanups.push(
    stubFetch(() =>
      Response.json(payload, {
        headers: { "content-type": "application/json" },
        status,
      }),
    ),
  );
}

describe("fetchCore", () => {
  test("検証済みのユーザーペイロードを返す", async () => {
    stubGraphql(graphqlPayloadFixture());
    const result: Result<GithubUserPayload, GithubFailure> = await fetchCore("octocat");
    expect(result.isOk).toBe(true);
    expect(result.unwrapOr({ login: "" }).login).toBe("octocat");
  });

  test("user が無い応答は not-found として扱う", async () => {
    stubGraphql({ data: {}, errors: [{ message: "Could not resolve to a User" }] });
    const result: Result<GithubUserPayload, GithubFailure> = await fetchCore("ghost");
    expect(result.isErr).toBe(true);
    expect(result.isErr ? result.error.kind : "").toBe("not-found");
  });

  test("スキーマに合わない応答は invalid-payload として扱う", async () => {
    stubGraphql({ data: { user: { login: "octocat" } } });
    const result: Result<GithubUserPayload, GithubFailure> = await fetchCore("octocat");
    expect(result.isErr).toBe(true);
    expect(result.isErr ? result.error.kind : "").toBe("invalid-payload");
  });

  test("403 と rate limit ヘッダーは rate-limited として扱う", async () => {
    cleanups.push(
      stubFetch(
        () =>
          new Response("{}", {
            headers: { "x-ratelimit-remaining": "0" },
            status: 403,
          }),
      ),
    );
    const result: Result<GithubUserPayload, GithubFailure> = await fetchCore("octocat");
    expect(result.isErr ? result.error.kind : "").toBe("rate-limited");
  });
});

describe("fetchActivity", () => {
  test("イベント配列を検証して返す", async () => {
    cleanups.push(stubFetch(() => Response.json(eventsPayloadFixture(), { status: 200 })));
    const result: Result<readonly GithubEventPayload[], GithubFailure> =
      await fetchActivity("octocat");
    expect(result.isOk).toBe(true);
    expect(result.unwrapOr([]).length).toBe(3);
  });

  test("404 は not-found として扱う", async () => {
    cleanups.push(stubFetch(() => new Response("{}", { status: 404 })));
    const result: Result<readonly GithubEventPayload[], GithubFailure> =
      await fetchActivity("ghost");
    expect(result.isErr ? result.error.kind : "").toBe("not-found");
  });
});

describe("resolveUsername", () => {
  test("未設定なら missing-username を返す", () => {
    delete process.env.GITHUB_USERNAME;
    const result: Result<string, GithubFailure> = resolveUsername();
    expect(result.isErr).toBe(true);
    expect(result.isErr ? (result.error as GithubFailure).kind : "").toBe("missing-username");
  });

  test("設定済みなら値を返す", () => {
    process.env.GITHUB_USERNAME = "octocat";
    const result: Result<string, GithubFailure> = resolveUsername();
    expect(result.unwrapOr("")).toBe("octocat");
  });
});
